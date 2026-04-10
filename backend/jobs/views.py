from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Job
from .serializers import JobSerializer
from .utils import load_jobs_from_csv


@api_view(['GET'])
def job_list(request):
    jobs = Job.objects.all().order_by('-created_at')

    status_filter = request.query_params.get('status')
    tag_filter = request.query_params.get('tag')
    search = request.query_params.get('search')

    if status_filter:
        jobs = jobs.filter(application_status__iexact=status_filter)
    if tag_filter:
        jobs = jobs.filter(tag__iexact=tag_filter)
    if search:
        jobs = jobs.filter(company_name__icontains=search) | \
               jobs.filter(job_title__icontains=search)

    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def job_create(request):
    serializer = JobSerializer(data=request.data)
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
        serializer = JobSerializer(job, data=request.data, partial=True)
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

    tag_counts = {}
    for job in jobs:
        t = job.tag or 'Untagged'
        tag_counts[t] = tag_counts.get(t, 0) + 1

    return Response({
        'total': total,
        'by_status': status_counts,
        'by_tag': tag_counts,
    })