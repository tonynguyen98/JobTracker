'use client'

import { useEffect, useState, useCallback } from 'react'
import { getJobs, getStats, createJob, updateJob, deleteJob } from '@/lib/api'
import { Job, JobStats } from '@/types/job'
import JobTable from '@/components/JobTable'
import StatCards from '@/components/StatCards'
import JobModal from '@/components/JobModal'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; job: Job }

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getJobs({ status: activeStatus, search })
      setJobs(data)
    } finally {
      setLoading(false)
    }
  }, [activeStatus, search])

  const fetchStats = useCallback(async () => {
    const data = await getStats()
    setStats(data)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchStats() }, [fetchStats, jobs])

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

  return (
    <main className="min-h-screen bg-gray-50 px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Job Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats ? `${stats.total} applications` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Add application
        </button>
      </div>

      {stats && (
        <StatCards
          stats={stats}
          activeStatus={activeStatus}
          onStatusClick={s => setActiveStatus(prev => prev === s ? '' : s)}
        />
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by company or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-400 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <JobTable
        jobs={jobs}
        loading={loading}
        onEdit={job => setModal({ mode: 'edit', job })}
      />

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
    </main>
  )
}