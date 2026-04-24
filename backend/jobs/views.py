from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Job
from .serializers import JobSerializer
from .utils import load_jobs_from_content
from .sanitizers import sanitize_job
import math
from datetime import date, timedelta
from django.db.models import Count
from collections import Counter


@api_view(['GET'])
def job_list(request):
    jobs = Job.objects.all().order_by('-date_applied', '-id') 

    status_filter = request.query_params.get('status')
    search = request.query_params.get('search')
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))

    if status_filter:
        jobs = jobs.filter(application_status__iexact=status_filter)
    if search:
        jobs = jobs.filter(company_name__icontains=search) | \
               jobs.filter(job_title__icontains=search)

    total = jobs.count()
    total_pages = math.ceil(total / page_size) if page_size else 1
    start = (page - 1) * page_size
    end = start + page_size

    serializer = JobSerializer(jobs[start:end], many=True)
    return Response({
        'results': serializer.data,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages,
    })


@api_view(['POST'])
def job_create(request):
    clean = sanitize_job(request.data)

    if not clean['company_name']:
        return Response({'error': 'Company name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not clean['job_title']:
        return Response({'error': 'Job title is required.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = JobSerializer(data=clean)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
def job_detail(request, pk):
    try:
        job = Job.objects.get(pk=pk)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(JobSerializer(job).data)

    if request.method == 'PATCH':
        clean = sanitize_job({**JobSerializer(job).data, **request.data})
        serializer = JobSerializer(job, data=clean, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def job_stats(request):
    # 1. Fetch data efficiently
    # We fetch only the fields we need to keep memory usage low
    jobs_data = Job.objects.values('application_status', 'date_applied')
    total = jobs_data.count()

    # 2. Status counts & Pipeline Logic (One pass through the data)
    status_counts = {}
    applied_dates = []
    
    for job in jobs_data:
        # Status counts
        s = job['application_status'] or 'Unknown'
        status_counts[s] = status_counts.get(s, 0) + 1
        
        # Collect dates for later processing
        if job['date_applied']:
            applied_dates.append(job['date_applied'])

    # Active pipeline & Response rate
    terminal = {'Accepted', 'Rejected', 'No Reply', 'Not Started', 'No Offer'}
    active = sum(v for k, v in status_counts.items() if k not in terminal)
    
    responded = sum(v for k, v in status_counts.items() if k not in {'Not Started', 'Applied', 'No Reply'})
    applied_total = total - status_counts.get('Not Started', 0)
    response_rate = round((responded / applied_total) * 100) if applied_total > 0 else 0

    # 3. Daily Stats (Last 30 days) - Processed in Python
    thirty_days_ago = date.today() - timedelta(days=30)
    # Filter dates and count occurrences using Counter
    recent_dates = [d for d in applied_dates if d >= thirty_days_ago]
    daily_map = Counter(recent_dates)
    
    applications_over_time = []
    for i in range(30):
        day = thirty_days_ago + timedelta(days=i)
        applications_over_time.append({
            'date': str(day), 
            'count': daily_map.get(day, 0)
        })

    # 4. Weekly Stats - Processed in Python
    weekly_data = []
    if applied_dates:
        # Group all dates by their respective Monday
        weekly_map = Counter()
        for d in applied_dates:
            monday = d - timedelta(days=d.weekday())
            weekly_map[monday] += 1
        
        # Fill all weeks from the first application to today
        earliest_date = min(applied_dates)
        start_week = earliest_date - timedelta(days=earliest_date.weekday())
        
        current_week = start_week
        today = date.today()
        while current_week <= today:
            weekly_data.append({
                'week': str(current_week),
                'count': weekly_map.get(current_week, 0),
                'label': current_week.strftime('%-m/%-d'),
            })
            current_week += timedelta(weeks=1)

    return Response({
        'total': total,
        'active': active,
        'response_rate': response_rate,
        'by_status': status_counts,
        'applications_over_time': applications_over_time,
        'weekly_applications': weekly_data,
        'top_companies': [],
    })


@api_view(['POST'])
def upload_csv(request):
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        content = file.read().decode('utf-8-sig')
        rows = load_jobs_from_content(content)
    except Exception as e:
        return Response({'error': f'Failed to parse CSV: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    if not rows:
        return Response({'error': 'CSV is empty or has no matching columns'}, status=status.HTTP_400_BAD_REQUEST)

    # sanitize every row from the CSV
    rows = [sanitize_job(row) for row in rows]

    # skip rows that came out empty after sanitization
    rows = [r for r in rows if r.get('company_name')]

    existing = Job.objects.all()
    existing_map = {
        (j.company_name.lower(), j.job_title.lower(), str(j.date_applied)): j
        for j in existing
    }

    COMPARABLE_FIELDS = [
        'job_link', 'type_of_job', 'salary_annual',
        'application_status', 'notes',
    ]

    created = 0
    updated = 0
    skipped = 0
    jobs_to_create = []
    jobs_to_update = []

    for row in rows:
        key = (
            row['company_name'].lower(),
            row['job_title'].lower(),
            str(row['date_applied']),
        )
        existing_job = existing_map.get(key)

        if existing_job is None:
            jobs_to_create.append(Job(**row))
        else:
            changed_fields = []
            for field in COMPARABLE_FIELDS:
                incoming = row.get(field) or ''
                current = getattr(existing_job, field) or ''
                if str(incoming).strip() != str(current).strip():
                    setattr(existing_job, field, incoming)
                    changed_fields.append(field)

            if changed_fields:
                jobs_to_update.append((existing_job, changed_fields))
            else:
                skipped += 1

    # bulk create new jobs
    if jobs_to_create:
        Job.objects.bulk_create(jobs_to_create)
        created = len(jobs_to_create)

    # bulk update only changed fields per job
    if jobs_to_update:
        all_fields = set()
        for _, fields in jobs_to_update:
            all_fields.update(fields)
        Job.objects.bulk_update(
            [j for j, _ in jobs_to_update],
            list(all_fields),
        )
        updated = len(jobs_to_update)

    return Response({
        'total_in_csv': len(rows),
        'created': created,
        'updated': updated,
        'skipped': skipped,
    })