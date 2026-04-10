import re
from urllib.parse import urlparse

from .constants import ALLOWED_STATUSES, DEFAULT_STATUS


def sanitize_text(val: str, max_length: int = 255) -> str:
    if not val:
        return ''
    # strip leading/trailing whitespace, collapse internal whitespace
    cleaned = re.sub(r'\s+', ' ', str(val).strip())
    # strip any html-like tags
    cleaned = re.sub(r'<[^>]+>', '', cleaned)
    return cleaned[:max_length]


def sanitize_url(val: str, max_length: int = 2000) -> str:
    if not val:
        return ''
    url = val.strip()
    # add protocol if missing
    if url and not url.startswith(('http://', 'https://')):
        if '.' in url and ' ' not in url:
            url = f'https://{url}'
        else:
            return ''
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return ''
        # block non-http schemes (ftp, javascript, etc.)
        if parsed.scheme not in ('http', 'https'):
            return ''
    except Exception:
        return ''
    return url[:max_length]


def format_salary(val: str) -> str:
    if not val:
        return ''

    raw = str(val).strip()

    # convert K/k shorthand to full numbers e.g. 120k -> 120000
    raw = re.sub(
        r'(\d+(?:\.\d+)?)\s*[kK]\b',
        lambda m: str(round(float(m.group(1)) * 1000)),
        raw
    )

    # extract all numbers
    nums = [
        round(float(m.group(1).replace(',', '')))
        for m in re.finditer(r'\$?\s*([\d,]+(?:\.\d+)?)', raw)
    ]

    if not nums:
        return val.strip()

    def fmt(n: int) -> str:
        return f'${n:,}'

    if len(nums) >= 2:
        return f'{fmt(nums[0])} - {fmt(nums[1])}'
    return fmt(nums[0])


def sanitize_application_status(val: str) -> str:
    cleaned = sanitize_text(val, max_length=50)
    return cleaned if cleaned in ALLOWED_STATUSES else DEFAULT_STATUS


def sanitize_job(data: dict) -> dict:
    date_applied = data.get('date_applied')
    return {
        'company_name':       sanitize_text(data.get('company_name', ''), 255),
        'job_link':           sanitize_url(data.get('job_link', '')),
        'job_title':          sanitize_text(data.get('job_title', ''), 255),
        'date_applied':       date_applied,
        'type_of_job':        sanitize_text(data.get('type_of_job', ''), 100),
        'salary_annual':      format_salary(data.get('salary_annual', '')),
        'application_status': sanitize_application_status(data.get('application_status', '')),
        'notes':              sanitize_text(data.get('notes', ''), 2000),
        'created_at':         date_applied or data.get('created_at'),
    }