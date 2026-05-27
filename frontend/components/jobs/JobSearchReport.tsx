'use client'

import { useMemo } from 'react'
import { Job } from '@/lib/types'
import { getStatusStyle, orderStatusEntries, STATUS_GROUPS } from '@/lib/constants'

interface Props {
  jobs: Job[]
  onClose: () => void
}

function fmt(d: string | null | undefined, opts: Intl.DateTimeFormatOptions) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', opts)
}

export default function JobSearchReport({ jobs, onClose }: Props) {
  const data = useMemo(() => {
    const applied = jobs.filter(j => j.application_status !== 'Not Started')
    const n = applied.length

    const screened = applied.filter(j => STATUS_GROUPS.SCREENED.has(j.application_status)).length
    const interviewed = applied.filter(j => STATUS_GROUPS.INTERVIEWED.has(j.application_status)).length
    const offers = applied.filter(j => STATUS_GROUPS.OFFERED.has(j.application_status)).length
    const active = applied.filter(j => !STATUS_GROUPS.TERMINAL.has(j.application_status)).length

    const byStatus: Record<string, number> = {}
    applied.forEach(j => {
      const s = j.application_status || 'Unknown'
      byStatus[s] = (byStatus[s] ?? 0) + 1
    })

    // Date range
    const validDates = applied
      .map(j => j.date_applied)
      .filter((d): d is string => Boolean(d))
      .sort()
    const firstDate = validDates[0] ?? null
    const lastDate = validDates[validDates.length - 1] ?? null
    const durationDays =
      firstDate && lastDate
        ? Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000)
        : 0

    // Most common job title
    const titleCounts: Record<string, number> = {}
    applied.forEach(j => {
      if (j.job_title) titleCounts[j.job_title] = (titleCounts[j.job_title] ?? 0) + 1
    })
    const topTitleEntry = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0] ?? null

    // Peak week
    const weekCounts: Record<string, number> = {}
    applied.forEach(j => {
      if (!j.date_applied) return
      const d = new Date(j.date_applied + 'T12:00:00')
      const day = d.getDay()
      const offset = day === 0 ? -6 : 1 - day
      const monday = new Date(d)
      monday.setDate(d.getDate() + offset)
      const key = monday.toISOString().slice(0, 10)
      weekCounts[key] = (weekCounts[key] ?? 0) + 1
    })
    const peakWeekEntry = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0] ?? null

    // Daily counts for timeline
    const dailyCounts: Record<string, number> = {}
    applied.forEach(j => {
      if (j.date_applied) dailyCounts[j.date_applied] = (dailyCounts[j.date_applied] ?? 0) + 1
    })

    const responseRate = n > 0 ? Math.round((screened / n) * 100) : 0
    const interviewRate = n > 0 ? Math.round((interviewed / n) * 100) : 0
    const offerRate = n > 0 ? +((offers / n) * 100).toFixed(1) : 0

    return {
      total: n,
      screened,
      interviewed,
      offers,
      active,
      noReply: byStatus['No Reply'] ?? 0,
      noOffer: byStatus['No Offer'] ?? 0,
      rejected: byStatus['Rejected'] ?? 0,
      denied: byStatus['Denied'] ?? 0,
      accepted: byStatus['Accepted'] ?? 0,
      firstDate,
      lastDate,
      durationDays,
      topTitle: topTitleEntry?.[0] ?? null,
      topTitleCount: topTitleEntry?.[1] ?? 0,
      peakWeekDate: peakWeekEntry?.[0] ?? null,
      peakWeekCount: peakWeekEntry?.[1] ?? 0,
      responseRate,
      interviewRate,
      offerRate,
      byStatus,
      dailyCounts,
    }
  }, [jobs])

  const funnelStages = [
    {
      label: 'Applications Sent',
      sublabel: 'Total submitted',
      count: data.total,
      color: '#6366f1',
      pct: 100,
    },
    {
      label: 'Got a Response',
      sublabel: 'Companies replied back',
      count: data.screened,
      color: '#3b82f6',
      pct: data.responseRate,
    },
    {
      label: 'Made it to Interview',
      sublabel: 'Interview stage reached',
      count: data.interviewed,
      color: '#f59e0b',
      pct: data.interviewRate,
    },
    {
      label: 'Received an Offer',
      sublabel: 'Written offers extended',
      count: data.offers,
      color: '#10b981',
      pct: data.offerRate,
    },
  ]

  const timelineEntries = Object.entries(data.dailyCounts).sort(([a], [b]) => a.localeCompare(b))
  const maxDay = Math.max(...timelineEntries.map(([, c]) => c), 1)

  const statusEntries = orderStatusEntries(
    Object.entries(data.byStatus).filter(([, c]) => c > 0)
  )

  const outcomes = [
    {
      label: 'No Reply',
      desc: 'Ghosted after contact',
      count: data.noReply,
      color: '#f43f5e',
      bg: '#fff1f2',
      border: '#fecdd3',
    },
    {
      label: 'Rejected',
      desc: 'Direct rejection, no prior contact',
      count: data.rejected,
      color: '#ef4444',
      bg: '#fef2f2',
      border: '#fecaca',
    },
    {
      label: 'No Offer',
      desc: 'Went through process, no offer',
      count: data.noOffer,
      color: '#f97316',
      bg: '#fff7ed',
      border: '#fed7aa',
    },
    {
      label: 'Denied',
      desc: 'Withdrew before finishing',
      count: data.denied,
      color: '#334155',
      bg: '#f8fafc',
      border: '#cbd5e1',
    },
    {
      label: 'Offer',
      desc: 'Written offer received',
      count: data.offers - data.accepted,
      color: '#10b981',
      bg: '#f0fdf4',
      border: '#a7f3d0',
    },
    {
      label: 'Accepted',
      desc: 'Offer accepted',
      count: data.accepted,
      color: '#6366f1',
      bg: '#eef2ff',
      border: '#c7d2fe',
    },
  ]

  const funFacts = [
    {
      label: 'Response Rate',
      value: `${data.responseRate}%`,
      desc: `${data.screened} out of ${data.total} applications got a reply`,
    },
    {
      label: 'Interview Rate',
      value: `${data.interviewRate}%`,
      desc: `Interviews at ${data.interviewed} compan${data.interviewed === 1 ? 'y' : 'ies'}`,
    },
    {
      label: 'Offer Rate',
      value: `${data.offerRate}%`,
      desc: `${data.offers} written offer${data.offers !== 1 ? 's' : ''} from ${data.total} apps`,
    },
    ...(data.peakWeekDate && data.peakWeekCount > 0
      ? [
          {
            label: 'Peak Week',
            value: `${data.peakWeekCount} apps`,
            desc: `Week of ${fmt(data.peakWeekDate, { month: 'short', day: 'numeric', year: 'numeric' })}`,
          },
        ]
      : []),
    ...(data.topTitle
      ? [
          {
            label: 'Most Applied Role',
            value: data.topTitle.length > 22 ? data.topTitle.slice(0, 22) + '…' : data.topTitle,
            desc: `Applied ${data.topTitleCount} time${data.topTitleCount !== 1 ? 's' : ''}`,
          },
        ]
      : []),
    {
      label: 'Ghosted',
      value: String(data.noReply),
      desc: 'Companies that went silent after contact',
    },
    {
      label: 'Days Searching',
      value: data.durationDays > 0 ? String(data.durationDays) : '—',
      desc:
        data.firstDate && data.lastDate
          ? `${fmt(data.firstDate, { month: 'short', day: 'numeric' })} → ${fmt(data.lastDate, { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Date range not available',
    },
    {
      label: 'Still Active',
      value: String(data.active),
      desc: 'Applications still in the pipeline',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto print:static print:overflow-visible"
      style={{ background: '#f8fafc' }}
    >
      {/* Sticky toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.3" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Job Search Report</span>
            {data.firstDate && data.lastDate && (
              <span className="hidden sm:inline text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {fmt(data.firstDate, { month: 'short', year: 'numeric' })} —{' '}
                {fmt(data.lastDate, { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Save as PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 print:px-8 print:py-6 print:space-y-6">
        {/* ── HERO HEADER ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-300">
          <div
            className="px-8 py-10 text-white print:py-8"
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}
          >
            <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold mb-3">
              End-of-Search Review
            </p>
            <h1 className="text-4xl font-black tracking-tight mb-2 print:text-3xl">
              Your Job Search, Reviewed
            </h1>
            <p className="text-slate-300 text-lg">
              {fmt(data.firstDate, { month: 'long', day: 'numeric', year: 'numeric' })}
              {data.lastDate !== data.firstDate && (
                <> &ndash; {fmt(data.lastDate, { month: 'long', day: 'numeric', year: 'numeric' })}</>
              )}
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: 'Total Applications', value: data.total },
              { label: 'Days Searching', value: data.durationDays || '—' },
              { label: 'Still in Pipeline', value: data.active },
            ].map((stat, i) => (
              <div key={i} className="px-6 py-5">
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PIPELINE FUNNEL ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print:shadow-none print:border-gray-300">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Application Pipeline
          </h2>
          <p className="text-xs text-gray-400 mb-6">How far your applications made it</p>

          {/* Fixed stepped widths give a clean funnel shape regardless of actual counts */}
          <div className="space-y-0.5 w-full">
            {funnelStages.map((stage, i) => {
              const stepWidths = ['100%', '76%', '54%', '34%']
              const dropPct =
                i > 0 && funnelStages[i - 1].count > 0
                  ? Math.round(
                      ((funnelStages[i - 1].count - stage.count) / funnelStages[i - 1].count) * 100
                    )
                  : null

              return (
                <div key={i} className="flex flex-col items-center w-full">
                  {i > 0 && (
                    <div className="flex flex-col items-center my-1">
                      <svg width="24" height="12" viewBox="0 0 24 12">
                        <path d="M12 12L0 0h24L12 12z" fill="#e2e8f0" />
                      </svg>
                      {dropPct !== null && dropPct > 0 && (
                        <span className="text-[10px] text-gray-400 font-bold">
                          -{dropPct}% drop-off
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    style={{ width: stepWidths[i], backgroundColor: stage.color }}
                    className="rounded-xl px-4 py-4 text-white text-center min-w-0"
                  >
                    <p className="text-3xl font-black leading-none">{stage.count}</p>
                    <p className="text-sm font-semibold opacity-90 mt-1 truncate">{stage.label}</p>
                    <p className="text-xs opacity-70 mt-0.5 truncate">{stage.sublabel}</p>
                    {i > 0 && (
                      <span className="inline-block mt-2 text-xs font-bold bg-white/20 rounded-full px-2.5 py-0.5">
                        {stage.pct}% of total
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FINAL OUTCOMES ── */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Final Outcomes
          </h2>
          <p className="text-xs text-gray-400 mb-3">Where applications ended up</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {outcomes.map((o, i) => (
              <div
                key={i}
                style={{ background: o.bg, borderColor: o.border }}
                className="rounded-xl border p-4 text-center"
              >
                <p style={{ color: o.color }} className="text-3xl font-black">
                  {o.count}
                </p>
                <p className="text-xs font-bold text-gray-700 mt-1">{o.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FUN FACTS ── */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            By the Numbers
          </h2>
          <p className="text-xs text-gray-400 mb-3">Highlights from your search</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {funFacts.map((fact, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 print:shadow-none print:border-gray-300"
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {fact.label}
                </p>
                <p className="text-2xl font-black text-gray-900 mt-1 leading-tight">{fact.value}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">{fact.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ACTIVITY TIMELINE ── */}
        {timelineEntries.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print:shadow-none print:border-gray-300">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Application Timeline
            </h2>
            <p className="text-xs text-gray-400 mb-6">Daily application volume over your search</p>
            <div className="flex items-end gap-px h-28 w-full group">
              {timelineEntries.map(([date, count], i) => {
                const pct = (count / maxDay) * 100
                return (
                  <div
                    key={i}
                    className="flex-1 h-full flex flex-col justify-end group/bar relative"
                  >
                    <div
                      className="w-full rounded-t-sm bg-indigo-200 hover:bg-indigo-500 transition-colors"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/bar:scale-100 transition-transform origin-bottom bg-gray-900 text-white text-[10px] px-2 py-1 rounded z-20 pointer-events-none whitespace-nowrap">
                      {count} on {date.slice(5)}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>{timelineEntries[0]?.[0]?.slice(5)}</span>
              <span className="text-gray-400">Activity</span>
              <span>{timelineEntries[timelineEntries.length - 1]?.[0]?.slice(5)}</span>
            </div>
          </div>
        )}

        {/* ── FULL STATUS BREAKDOWN ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print:shadow-none print:border-gray-300">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Full Status Breakdown
          </h2>
          <p className="text-xs text-gray-400 mb-5">Every status and its share</p>
          <div className="space-y-3.5">
            {statusEntries.map(([status, count]) => {
              const { color } = getStatusStyle(status)
              const pct = data.total > 0 ? (count / data.total) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{status}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right tabular-nums">
                        {count}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="text-center text-xs text-gray-300 pb-4">
          Generated{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          &middot; Job Tracker
        </div>
      </div>
    </div>
  )
}
