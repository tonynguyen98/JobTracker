'use client'

import { JobStats } from '@/types/job'
import { getStatusStyle } from '@/lib/constants'

interface Props {
  stats: JobStats
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const width = 200
  const height = 40
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.count / max) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* area fill */}
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill="#6366f110"
        stroke="none"
      />
    </svg>
  )
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  // only show every 5th label to avoid crowding
  return (
    <div className="flex items-end gap-px h-16 w-full">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100
        const showLabel = i % 5 === 0
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 group relative">
            <div
              className="w-full bg-indigo-100 hover:bg-indigo-300 rounded-sm transition-colors cursor-default"
              style={{ height: `${Math.max(pct, d.count > 0 ? 8 : 2)}%` }}
            />
            {/* tooltip */}
            {d.count > 0 && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.count} on {d.date.slice(5)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Analytics({ stats }: Props) {
  const activeStatuses = Object.entries(stats.by_status)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const totalApplied = stats.total - (stats.by_status['Not Started'] ?? 0)
  const thisWeek = stats.applications_over_time
    .slice(-7)
    .reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-1">

      {/* Activity chart */}
      <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Applications — last 30 days</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalApplied}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">This week</p>
            <p className="text-lg font-bold text-indigo-500">{thisWeek}</p>
          </div>
        </div>
        <BarChart data={stats.applications_over_time} />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-300">{stats.applications_over_time[0]?.date.slice(5)}</span>
          <span className="text-xs text-gray-300">{stats.applications_over_time[stats.applications_over_time.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Pipeline + response rate */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active pipeline</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.active}</p>
          <p className="text-xs text-gray-400 mt-0.5">in progress</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Response rate</p>
          <div className="flex items-end gap-2 mt-0.5">
            <p className="text-2xl font-bold text-gray-900">{stats.response_rate}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-400 h-1.5 rounded-full transition-all"
              style={{ width: `${stats.response_rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">By status</p>
        <div className="space-y-2">
          {activeStatuses.slice(0, 6).map(([s, count]) => {
            const { bg, color } = getStatusStyle(s)
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            return (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${bg} w-36 truncate`}
                  style={{ color }}
                >
                  {s}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-5 text-right shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}