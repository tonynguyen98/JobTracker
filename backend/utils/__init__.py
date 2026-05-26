import csv
import re
from datetime import datetime
from urllib.parse import urlparse

from constants import ALLOWED_STATUSES, DEFAULT_STATUS

# ── CSV parsing ──────────────────────────────────────────────────────────────

COLUMN_MAP = {
    'Company Name': 'company_name',
    'Job Link': 'job_link',
    'Job Title': 'job_title',
    'Date Applied': 'date_applied',
    'Type of Job': 'type_of_job',
    'Salary (Annual)': 'salary_annual',
    'Application Status': 'application_status',
    'Notes': 'notes',
}


def parse_date(val):
    if not val:
        return None
    val = val.strip()
    for fmt in ('%B %d, %Y', '%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y'):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None


def _parse_rows(reader):
    jobs = []
    for row in reader:
        clean_row = {k.strip(): v for k, v in row.items() if k}
        job = {}
        for csv_col, model_field in COLUMN_MAP.items():
            val = (clean_row.get(csv_col) or '').strip()
            job[model_field] = parse_date(val) if model_field == 'date_applied' else val
        if job.get('company_name'):
            jobs.append(job)
    return jobs


def load_jobs_from_content(content: str):
    lines = content.splitlines()
    if lines and lines[0].startswith('Job Tracker'):
        lines = lines[1:]
    reader = csv.DictReader(lines)
    return _parse_rows(reader)


# ── Input sanitization ───────────────────────────────────────────────────────

def sanitize_text(val: str, max_length: int = 255) -> str:
    if not val:
        return ''
    cleaned = re.sub(r'\s+', ' ', str(val).strip())
    cleaned = re.sub(r'<[^>]+>', '', cleaned)
    return cleaned[:max_length]


def sanitize_url(val: str, max_length: int = 2000) -> str:
    if not val:
        return ''
    url = val.strip()
    if url and not url.startswith(('http://', 'https://')):
        if '.' in url and ' ' not in url:
            url = f'https://{url}'
        else:
            return ''
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return ''
        if parsed.scheme not in ('http', 'https'):
            return ''
    except Exception:
        return ''
    return url[:max_length]


def format_salary(val: str) -> str:
    if not val:
        return ''
    raw = str(val).strip()
    raw = re.sub(
        r'(\d+(?:\.\d+)?)\s*[kK]\b',
        lambda m: str(round(float(m.group(1)) * 1000)),
        raw,
    )
    nums = [
        round(float(m.group(1).replace(',', '')))
        for m in re.finditer(r'\$?\s*([\d,]+(?:\.\d+)?)', raw)
    ]
    if not nums:
        return val.strip()

    def fmt(n: int) -> str:
        return f'${n:,}'

    return f'{fmt(nums[0])} - {fmt(nums[1])}' if len(nums) >= 2 else fmt(nums[0])


def sanitize_application_status(val: str) -> str:
    cleaned = sanitize_text(val, max_length=50)
    return cleaned if cleaned in ALLOWED_STATUSES else DEFAULT_STATUS


def sanitize_job(data: dict) -> dict:
    return {
        'company_name':       sanitize_text(data.get('company_name', ''), 255),
        'job_link':           sanitize_url(data.get('job_link', '')),
        'job_title':          sanitize_text(data.get('job_title', ''), 255),
        'date_applied':       data.get('date_applied'),
        'type_of_job':        sanitize_text(data.get('type_of_job', ''), 100),
        'salary_annual':      format_salary(data.get('salary_annual', '')),
        'application_status': sanitize_application_status(data.get('application_status', '')),
        'notes':              sanitize_text(data.get('notes', ''), 2000),
    }
