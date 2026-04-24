'use client'

import { useState } from 'react'
import { DailyCount, JobStats, WeeklyCount } from '@/types/job'
import { getStatusStyle, orderStatusEntries } from '@/lib/constants'

interface Props {
  stats: JobStats
}

export default function Analytics({ stats }: Props) {
  const [view, setView] = useState<'daily' | 'weekly'>('daily')

  // Data Processing
  const activeStatuses = Object.entries(stats.by_status)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const statusBreakdown = orderStatusEntries(activeStatuses)
  const totalApplied = stats.total - (stats.by_status['Not Started'] ?? 0)
  const thisWeek = stats.applications_over_time
    .slice(-7)
    .reduce((sum, d) => sum + d.count, 0)

  // Chart Logic
  const chartData = view === 'daily'
    ? stats.applications_over_time
    : stats.weekly_applications.slice(-12) // Show last 12 weeks for clarity

  const max = Math.max(...chartData.map(d => Number('count' in d ? d.count : 0)), 1)

  return (
    <div className="space-y-4">
      {/* --- TOP METRICS ROW --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Applied', val: totalApplied },
          { label: 'Active Pipeline', val: stats.active, sub: 'in progress' },
          { label: 'Response Rate', val: `${stats.response_rate}%`, progress: stats.response_rate },
          { label: 'This Week', val: thisWeek, color: 'text-indigo-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color || 'text-gray-900'}`}>{stat.val}</p>
            {stat.sub && <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>}
            {stat.progress !== undefined && (
              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${stat.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* --- UNIFIED ACTIVITY CHART (Left 2/3) --- */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Application Velocity</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {view === 'daily' ? 'Last 30 days daily volume' : 'Last 12 weeks momentum'}
              </p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['daily', 'weekly'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-end">
            <div className="flex items-end gap-1 h-32 w-full group">
              {chartData.map((d, i) => {
                const pct = (d.count / max) * 100
                const isLatest = i === chartData.length - 1
                return (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end group/bar relative">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${isLatest ? 'bg-indigo-500' : 'bg-indigo-100 group-hover:bg-indigo-200'
                        }`}
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/bar:scale-100 transition-transform bg-gray-900 text-white text-[10px] px-2 py-1 rounded z-20 pointer-events-none whitespace-nowrap">
                      {d.count} apps {view === 'daily' ? `on ${(d as DailyCount).date?.slice(5)}` : `week ${(d as WeeklyCount).label}`}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>{view === 'daily' ? (chartData[0] as DailyCount)?.date?.slice(5) : (chartData[0] as WeeklyCount)?.label}</span>
              <span className="text-gray-400">Activity Trend</span>
              <span>{view === 'daily' ? 'Today' : (chartData[chartData.length - 1] as WeeklyCount)?.label}</span>
            </div>
          </div>
        </div>

        {/* --- BY STATUS (Right 1/3) --- */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By Status</h3>
          <div className="space-y-4">
            {statusBreakdown.map(([s, count]) => {
              const { color } = getStatusStyle(s)
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={s} className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-gray-600 truncate mr-2">{s}</span>
                    <span className="text-xs font-black text-gray-400 group-hover:text-gray-900 transition-colors">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Optional: Add a quick summary at the bottom of the status column */}
          <div className="mt-6 pt-4 border-t border-gray-50">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              <span>Avg response</span>
              <span className="text-gray-900">~{Math.round(totalApplied / (stats.active || 1))} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}