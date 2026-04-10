'use client'

import { useState } from 'react'
import { Job } from '@/types/job'
import { STATUS_OPTIONS, TYPE_OPTIONS, DEFAULT_STATUS_TEXT } from '@/lib/constants'

const EMPTY_FORM = {
  company_name: '',
  job_title: '',
  job_link: '',
  date_applied: new Date().toISOString().split('T')[0],
  type_of_job: '',
  salary_annual: '',
  application_status: DEFAULT_STATUS_TEXT,
  notes: '',
}

// ---- Sanitizers ----

function sanitizeText(val: string): string {
  return val.trim().replace(/\s+/g, ' ')
}

function sanitizeUrl(val: string): string {
  const trimmed = val.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  // if it looks like a URL but is missing protocol, add https
  if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`
  return trimmed
}

function formatSalary(raw: string): string {
  if (!raw.trim()) return ''

  // convert K/k shorthand to full numbers e.g. 120k -> 120000
  const normalized = raw.replace(/(\d+(?:\.\d+)?)\s*[kK]\b/g, (_, n) => {
    return String(Math.round(parseFloat(n) * 1000))
  })

  // extract all numbers
  const nums = [...normalized.matchAll(/\$?\s*([\d,]+(?:\.\d+)?)/g)]
    .map(m => Math.round(parseFloat(m[1].replace(/,/g, ''))))
    .filter(n => !isNaN(n))

  if (nums.length === 0) return raw.trim()

  const fmt = (n: number) => '$' + n.toLocaleString('en-US')

  return nums.length >= 2
    ? `${fmt(nums[0])} - ${fmt(nums[1])}`
    : fmt(nums[0])
}

// ---- Validators ----

interface FormErrors {
  company_name?: string
  job_title?: string
  job_link?: string
  salary_annual?: string
}

function validate(form: typeof EMPTY_FORM): FormErrors {
  const errors: FormErrors = {}

  if (!form.company_name.trim()) {
    errors.company_name = 'Company is required.'
  }

  if (!form.job_title.trim()) {
    errors.job_title = 'Role is required.'
  }

  if (form.job_link.trim()) {
    try {
      new URL(sanitizeUrl(form.job_link))
    } catch {
      errors.job_link = 'Enter a valid URL.'
    }
  }

  if (form.salary_annual.trim()) {
    const nums = [...form.salary_annual.matchAll(/\$?\s*([\d,]+(?:\.\d+)?)/g)]
    if (nums.length === 0) {
      errors.salary_annual = 'Use a format like $120,000 or 100,000 - 140,000.'
    }
  }

  return errors
}

interface Props {
  onClose: () => void
  onSave: (data: Partial<Job>) => Promise<void>
  onDelete?: () => Promise<void>
  initial?: Partial<Job>
  title?: string
}

export default function JobModal({ onClose, onSave, onDelete, initial, title = 'Add application' }: Props) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...Object.fromEntries(
      Object.entries(initial ?? {}).filter(([, v]) => v !== null && v !== undefined)
    ),
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }))
    // clear error on change
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSave = async () => {
    // sanitize before validating
    const sanitized = {
      ...form,
      company_name: sanitizeText(form.company_name),
      job_title: sanitizeText(form.job_title),
      job_link: sanitizeUrl(form.job_link),
      salary_annual: formatSalary(form.salary_annual),
      notes: sanitizeText(form.notes),
    }

    const errs = validate(sanitized)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    setServerError('')
    try {
      await onSave(sanitized)
      onClose()
    } catch {
      setServerError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
    } catch {
      setServerError('Delete failed. Try again.')
      setDeleting(false)
    }
  }

  const fieldClass = (error?: string) =>
    `w-full border ${error ? 'border-red-400' : 'border-gray-400'} bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-300' : 'focus:ring-gray-400'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Company *</label>
            <input
              value={form.company_name}
              onChange={e => set('company_name', e.target.value)}
              className={fieldClass(errors.company_name)}
              placeholder="Acme Corp"
            />
            {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Role *</label>
            <input
              value={form.job_title}
              onChange={e => set('job_title', e.target.value)}
              className={fieldClass(errors.job_title)}
              placeholder="Software Engineer"
            />
            {errors.job_title && <p className="text-red-500 text-xs mt-1">{errors.job_title}</p>}
          </div>

          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Job link</label>
            <input
              value={form.job_link}
              onChange={e => set('job_link', e.target.value)}
              className={fieldClass(errors.job_link)}
              placeholder="https://..."
            />
            {errors.job_link && <p className="text-red-500 text-xs mt-1">{errors.job_link}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select
              value={form.application_status}
              onChange={e => set('application_status', e.target.value)}
              className={fieldClass()}
            >
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={form.type_of_job}
              onChange={e => set('type_of_job', e.target.value)}
              className={fieldClass()}
            >
              <option value="">—</option>
              {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date applied</label>
            <input
              type="date"
              value={form.date_applied}
              onChange={e => set('date_applied', e.target.value)}
              className={fieldClass()}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Salary</label>
            <input
              value={form.salary_annual}
              onChange={e => set('salary_annual', e.target.value)}
              onBlur={e => set('salary_annual', formatSalary(e.target.value))}
              className={fieldClass(errors.salary_annual)}
              placeholder="120k - 140k"
            />
            {errors.salary_annual && <p className="text-red-500 text-xs mt-1">{errors.salary_annual}</p>}
          </div>

          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className={`${fieldClass()} resize-none`}
              placeholder="Recruiter name, referral, next steps..."
            />
          </div>
        </div>

        {serverError && <p className="text-red-500 text-xs mt-3">{serverError}</p>}

        <div className="flex items-center justify-between mt-6">
          <div>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}