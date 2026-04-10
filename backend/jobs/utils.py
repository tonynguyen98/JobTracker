import csv
import os
from datetime import datetime

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs.csv')

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
        # strip whitespace from all keys since CSV headers have trailing spaces
        clean_row = {k.strip(): v for k, v in row.items() if k}
        job = {}
        for csv_col, model_field in COLUMN_MAP.items():
            val = (clean_row.get(csv_col) or '').strip()
            job[model_field] = parse_date(val) if model_field == 'date_applied' else val
        # only keep rows that have at least a company name
        if job.get('company_name'):
            jobs.append(job)
    return jobs

def load_jobs_from_content(content: str):
    lines = content.splitlines()
    # strip the title row before DictReader sees it
    if lines and lines[0].startswith('Job Tracker'):
        lines = lines[1:]
    reader = csv.DictReader(lines)
    return _parse_rows(reader)

def load_jobs_from_csv():
    path = os.path.abspath(CSV_PATH)
    if not os.path.exists(path):
        return []
    with open(path, newline='', encoding='utf-8-sig') as f:
        content = f.read()
    lines = content.splitlines()
    if lines and lines[0].startswith('Job Tracker'):
        lines = lines[1:]
    reader = csv.DictReader(lines)
    return _parse_rows(reader)