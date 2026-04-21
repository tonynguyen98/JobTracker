'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getAllJobs, getJobs, getStats, createJob, updateJob, deleteJob } from '@/lib/api'
import { Job, JobStats } from '@/types/job'
import JobTable from '@/components/JobTable'
import StatCards from '@/components/StatCards'
import JobModal from '@/components/JobModal'
import CsvUploadButton from '@/components/CsvUploadButton'
import Analytics from '@/components/Analytics'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; job: Job }

const PAGE_SIZE = 20

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const sentinelRef = useRef<HTMLDivElement>(null)

  // initial fetch / refetch when filters change
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setPage(1)
    setHasMore(false) // prevent loadMore firing during refetch
    try {
      const data = await getJobs({ status: activeStatus, search, page: 1, page_size: PAGE_SIZE })
      setJobs(data.results)
      setHasMore(data.page < data.total_pages)
    } finally {
      setLoading(false)
    }
  }, [activeStatus, search])

  // load next page and append
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const data = await getJobs({ status: activeStatus, search, page: nextPage, page_size: PAGE_SIZE })
      setJobs(prev => {
        const existingIds = new Set(prev.map(j => j.id))
        const newJobs = data.results.filter(j => !existingIds.has(j.id))
        return [...prev, ...newJobs]
      })
      setPage(nextPage)
      setHasMore(nextPage < data.total_pages)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, activeStatus, search])

  const fetchStats = useCallback(async () => {
    const data = await getStats()
    setStats(data)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchStats() }, [fetchStats])

  // intersection observer on the sentinel div at the bottom of the table
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const handleCreate = async (data: Partial<Job>) => {
    await createJob(data)
    fetchJobs()
    fetchStats()
  }

  const handleUpdate = async (data: Partial<Job>) => {
    if (modal.mode !== 'edit') return
    await updateJob(modal.job.id, data)
    fetchJobs()
    fetchStats()
  }

  const handleDelete = async () => {
    if (modal.mode !== 'edit') return
    await deleteJob(modal.job.id)
    setModal({ mode: 'closed' })
    fetchJobs()
    fetchStats()
  }

  const exportJobsToCsv = (jobsToExport: Job[]) => {
    const headers = [
      'Company Name',
      'Role',
      'Job Link',
      'Applied Date',
      'Type',
      'Salary',
      'Status',
      'Notes',
      'Created At',
    ]

    const escapeCsv = (value: string | null | undefined) => {
      const text = String(value ?? '')
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }

    const rows = jobsToExport.map(job => [
      job.company_name,
      job.job_title,
      job.job_link,
      job.date_applied,
      job.type_of_job,
      job.salary_annual,
      job.application_status,
      job.notes,
      job.created_at,
    ].map(escapeCsv).join(','))

    return [headers.join(','), ...rows].join('\n')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const allJobs = await getAllJobs()
      const csv = exportJobsToCsv(allJobs)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      // ignore export errors silently for now
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0 hover:opacity-75 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.3" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">Job Tracker</span>
            {stats && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {stats.total} applications
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="border border-amber-300 bg-amber-50 text-amber-700 text-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {exporting ? 'Backing up...' : 'Export CSV'}
              </button>
              <CsvUploadButton onComplete={() => { fetchJobs(); fetchStats() }} />
            </div>
            <button
              onClick={() => setModal({ mode: 'create' })}
              className="w-full sm:w-auto text-center bg-gray-900 text-white text-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {stats && (
          <StatCards
            stats={stats}
            activeStatus={activeStatus}
            onStatusClick={s => setActiveStatus(prev => prev === s ? '' : s)}
          />
        )}

        {stats && <Analytics stats={stats} />}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search company or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 w-64"
              />
            </div>
            {activeStatus && (
              <button
                onClick={() => setActiveStatus('')}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <span>Filtered: {activeStatus}</span>
                <span>✕</span>
              </button>
            )}
          </div>

          <JobTable
            jobs={jobs}
            loading={loading}
            onEdit={job => setModal({ mode: 'edit', job })}
          />

          {/* sentinel — intersection observer watches this */}
          <div ref={sentinelRef} className="h-1" />

          {/* loading more indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {/* end of results */}
          {!hasMore && jobs.length > 0 && !loading && (
            <div className="text-center py-4 text-xs text-gray-300">
              {jobs.length} applications
            </div>
          )}
        </div>
      </main>

      {modal.mode === 'create' && (
        <JobModal
          title="Add application"
          onClose={() => setModal({ mode: 'closed' })}
          onSave={handleCreate}
        />
      )}

      {modal.mode === 'edit' && (
        <JobModal
          title="Edit application"
          initial={modal.job}
          onClose={() => setModal({ mode: 'closed' })}
          onSave={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}