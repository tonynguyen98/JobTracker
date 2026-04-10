'use client'

import { useState } from 'react'
import { Job } from '@/types/job'
import { STATUS_COLORS } from '@/lib/constants'

type SortKey = keyof Job
type SortDir = 'asc' | 'desc'

interface Props {
  jobs: Job[]
  loading: boolean
  onEdit: (job: Job) => void
}

const COLUMNS: { label: string; key: SortKey }[] = [
  { label: 'Company', key: 'company_name' },
  { label: 'Role', key: 'job_title' },
  { label: 'Status', key: 'application_status' },
  { label: 'Type', key: 'type_of_job' },
  { label: 'Salary', key: 'salary_annual' },
  { label: 'Applied', key: 'date_applied' },
]

const SKELETON_ROWS = 8

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function JobTable({ jobs, loading, onEdit }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...jobs].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const showSkeleton = loading && jobs.length === 0

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 transition-opacity duration-150 ${loading ? 'opacity-60' : 'opacity-100'}`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-4 py-3 text-left cursor-pointer hover:text-gray-800 select-none whitespace-nowrap"
              >
                {col.label}{arrow(col.key)}
              </th>
            ))}
            <th className="px-4 py-3 text-left">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {showSkeleton
            ? [...Array(SKELETON_ROWS)].map((_, i) => <SkeletonRow key={i} />)
            : sorted.map(job => {
              const statusColor = STATUS_COLORS[job.application_status] ?? STATUS_COLORS.default
              return (
                <tr
                  key={job.id}
                  onClick={() => onEdit(job)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {job.job_link ? (
                      <a
                        href={job.job_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="hover:underline text-blue-700"
                      >
                        {job.company_name}
                      </a>
                    ) : (
                      job.company_name
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{job.job_title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      {job.application_status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.type_of_job || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{job.salary_annual || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{job.date_applied ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{job.notes || '—'}</td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div >
  )
}