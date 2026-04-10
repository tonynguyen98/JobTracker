from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Job
from .serializers import JobSerializer
from .utils import load_jobs_from_content
from .sanitizers import sanitize_job
import math


@api_view(['GET'])
def job_list(request):
    jobs = Job.objects.all().order_by('-created_at')

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
    jobs = Job.objects.all()
    total = jobs.count()

    status_counts = {}
    for job in jobs:
        s = job.application_status or 'Unknown'
        status_counts[s] = status_counts.get(s, 0) + 1

    return Response({
        'total': total,
        'by_status': status_counts,
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