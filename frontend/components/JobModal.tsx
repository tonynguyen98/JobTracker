'use client'

import { useState } from 'react'
import { Job } from '@/types/job'
import { STATUS_OPTIONS } from '@/lib/constants'

const TYPE_OPTIONS = ['Full-Time', 'Contract']

const EMPTY_FORM = {
  company_name: '',
  job_title: '',
  job_link: '',
  date_applied: new Date().toISOString().split('T')[0],
  type_of_job: '',
  salary_annual: '',
  application_status: 'Applied',
  notes: '',
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
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const handleSave = async () => {
    if (!form.company_name.trim() || !form.job_title.trim()) {
      setError('Company and role are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch {
      setError('Something went wrong. Try again.')
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
      setError('Delete failed. Try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
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
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Acme Corp"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Role *</label>
            <input
              value={form.job_title}
              onChange={e => set('job_title', e.target.value)}
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Software Engineer"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Job link</label>
            <input
              value={form.job_link}
              onChange={e => set('job_link', e.target.value)}
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select
              value={form.application_status}
              onChange={e => set('application_status', e.target.value)}
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"            >
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={form.type_of_job}
              onChange={e => set('type_of_job', e.target.value)}
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
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
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Salary</label>
            <input
              value={form.salary_annual}
              onChange={e => set('salary_annual', e.target.value)}
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="$120,000"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
              placeholder="Recruiter name, referral, next steps..."
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

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