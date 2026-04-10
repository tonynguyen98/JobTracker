import csv
import os
from datetime import datetime

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'jobs.csv')

COLUMN_MAP = {
    'company name': 'company_name',
    'job link': 'job_link',
    'job title': 'job_title',
    'date applied': 'date_applied',
    'type of job': 'type_of_job',
    'salary (annual)': 'salary_annual',
    'application status': 'application_status',
    'notes': 'notes',
    'tag': 'tag',
}

def parse_date(val):
    # Added '%B %d, %Y' for "March 9, 2026"
    for fmt in ('%B %d, %Y', '%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y'):
        try:
            return datetime.strptime(val.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
    return None

def load_jobs_from_csv():
    jobs = []
    path = os.path.abspath(CSV_PATH)

    if not os.path.exists(path):
        return jobs

    with open(path, newline='', encoding='utf-8-sig') as f:
        # Skip the "Job Tracker" title row if it exists
        first_line = f.readline()
        if "Job Tracker" in first_line:
            pass # Header is on the next line
        else:
            f.seek(0) # No title row, go back to start

        reader = csv.DictReader(f)
        
        # Clean the fieldnames (headers) to remove whitespace and make lowercase
        # This solves the "Company Name " vs "Company Name" issue
        reader.fieldnames = [name.strip().lower() for name in reader.fieldnames]

        for row in reader:
            job = {}
            for csv_col, model_field in COLUMN_MAP.items():
                # We match the cleaned lowercase column names
                val = row.get(csv_col, '').strip()
                if model_field == 'date_applied':
                    job[model_field] = parse_date(val)
                else:
                    job[model_field] = val
            
            if any(job.values()):
                jobs.append(job)

    return jobs