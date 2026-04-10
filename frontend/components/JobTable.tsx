'use client'

import { useState } from 'react'
import { Job } from '@/types/job'
import { getStatusStyle } from '@/lib/constants'

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
  { label: 'Notes', key: 'notes' },
]

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${55 + (i * 19) % 35}%` }} />
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
    return <span className="ml-1 text-gray-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const showSkeleton = loading && jobs.length === 0

  return (
    <div className={`transition-opacity duration-150 ${loading ? 'opacity-60' : 'opacity-100'}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none whitespace-nowrap"
              >
                {col.label}{arrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {showSkeleton
            ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
            : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    No applications found.
                  </td>
                </tr>
              )
              : sorted.map(job => {
                const { bg, color } = getStatusStyle(job.application_status)
                return (
                  <tr
                    key={job.id}
                    onClick={() => onEdit(job)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {job.job_link ? (
                        <a
                          href={job.job_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          {job.company_name}
                        </a>
                      ) : (
                        job.company_name
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs">{job.job_title}</td>
                    <td className="px-5 py-3.5">
                      {job.application_status ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${bg}`}
                          style={{ color: color }}
                        >
                          {job.application_status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{job.type_of_job || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{job.salary_annual || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{job.date_applied ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 max-w-xs truncate">{job.notes || '—'}</td>
                  </tr>
                )
              })
          }
        </tbody>
      </table>
    </div >
  )
}