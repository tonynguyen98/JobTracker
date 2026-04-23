'use client'

import { JobStats, WeeklyCount } from '@/types/job'
import { getStatusStyle, orderStatusEntries } from '@/lib/constants'

interface Props {
  stats: JobStats
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => Number(d.count)), 1)
  return (
    <div className="flex items-end gap-px h-16 w-full">
      {data.map((d) => {
        const pct = (Number(d.count) / max) * 100
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 h-full group relative">
            {/* Added h-full above ^ */}
            <div className="flex-1 w-full" /> {/* Spacer to push bar to bottom */}
            <div
              className="w-full bg-indigo-100 hover:bg-indigo-300 rounded-sm transition-all cursor-default"
              style={{
                height: `${pct}%`,
                minHeight: d.count > 0 ? '4px' : '1px'
              }}
            />
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

function WeeklyTrendChart({ data }: { data: WeeklyCount[] }) {
  const max = Math.max(...data.map(d => Number(d.count)), 1)
  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.count, 0) / data.length) : 0
  const last4 = data.slice(-4)
  const prev4 = data.slice(-8, -4)
  const last4avg = last4.length > 0 ? last4.reduce((s, d) => s + d.count, 0) / last4.length : 0
  const prev4avg = prev4.length > 0 ? prev4.reduce((s, d) => s + d.count, 0) / prev4.length : 0
  const trend = prev4avg > 0 ? Math.round(((last4avg - prev4avg) / prev4avg) * 100) : 0
  const trendUp = trend >= 0

  // show last 12 weeks max, scrollable context
  const visible = data.slice(-12)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly applications</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{avg} <span className="text-sm font-normal text-gray-400">avg / week</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-1">vs prev 4 weeks</p>
          <span className={`text-sm font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        </div>
      </div>

      {/* bar chart */}
      <div className="flex items-end gap-1 h-20 w-full mb-1">
        {visible.map((d, i) => {
          const pct = (Number(d.count) / max) * 100
          const isRecent = i >= visible.length - 4
          return (
            <div key={d.week} className="flex flex-col items-center flex-1 h-full group relative">
              {/* Added h-full above ^ */}
              <div className="flex-1 w-full" /> {/* Spacer */}
              <div
                className={`w-full rounded-t-sm transition-all cursor-default ${isRecent ? 'bg-indigo-400 hover:bg-indigo-500' : 'bg-indigo-100 hover:bg-indigo-200'
                  }`}
                style={{
                  height: `${pct}%`,
                  minHeight: d.count > 0 ? '6px' : '1px'
                }}
              />
              {d.count > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {d.count} week of {d.label}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* week labels */}
      <div className="flex justify-between">
        <span className="text-xs text-gray-300">{visible[0]?.label}</span>
        <span className="text-xs text-gray-400 font-medium">last 4 wks highlighted</span>
        <span className="text-xs text-gray-300">{visible[visible.length - 1]?.label}</span>
      </div>

      {/* all-time summary row */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400">Total weeks</p>
          <p className="text-sm font-semibold text-gray-700">{data.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Best week</p>
          <p className="text-sm font-semibold text-gray-700">
            {Math.max(...data.map(d => d.count))} apps
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">This week</p>
          <p className="text-sm font-semibold text-indigo-600">
            {data[data.length - 1]?.count ?? 0} apps
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Avg / week</p>
          <p className="text-sm font-semibold text-gray-700">{avg}</p>
        </div>
      </div>
    </div>
  )
}

export default function Analytics({ stats }: Props) {
  const activeStatuses = Object.entries(stats.by_status)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const statusBreakdown = orderStatusEntries(activeStatuses)
  const totalApplied = stats.total - (stats.by_status['Not Started'] ?? 0)
  const thisWeek = stats.applications_over_time
    .slice(-7)
    .reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-3">
      {/* row 1 — daily + pipeline + status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* daily chart */}
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

        {/* pipeline + response rate */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active pipeline</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.active}</p>
            <p className="text-xs text-gray-400 mt-0.5">in progress</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Response rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.response_rate}%</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-indigo-400 h-1.5 rounded-full transition-all"
                style={{ width: `${stats.response_rate}%` }}
              />
            </div>
          </div>
        </div>

        {/* status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">By status</p>
          <div className="space-y-2">
            {statusBreakdown.map(([s, count]) => {
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
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* row 2 — weekly trend full width */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <WeeklyTrendChart data={stats.weekly_applications} />
      </div>
    </div>
  )
}