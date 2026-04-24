import { JobStats } from '@/types/job'
import { getStatusStyle, orderStatusEntries } from '@/lib/constants'

interface Props {
  stats: JobStats
  activeStatus: string
  onStatusClick: (status: string) => void
}

export default function StatCards({ stats, activeStatus, onStatusClick }: Props) {
  const orderedStatuses = orderStatusEntries(Object.entries(stats.by_status))

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
      {/* Total card */}
      <button
        onClick={() => onStatusClick('')}
        className={`shrink-0 rounded-2xl px-5 py-4 text-left border transition-all min-w-[120px] shadow-sm ${activeStatus === ''
          ? 'bg-gray-900 border-gray-900'
          : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
      >
        <div className={`text-2xl font-bold tracking-tight ${activeStatus === '' ? 'text-white' : 'text-gray-900'}`}>
          {stats.total}
        </div>
        <div className={`text-xs mt-1 font-medium whitespace-nowrap ${activeStatus === '' ? 'text-gray-400' : 'text-gray-500'}`}>
          All applications
        </div>
      </button>

      {/* Divider */}
      <div className="shrink-0 w-px bg-gray-200 my-2" />

      {/* Status cards */}
      {orderedStatuses.map(([status, count]) => {
        const { bg, color } = getStatusStyle(status)
        const isActive = activeStatus === status
        return (
          <button
            key={status}
            onClick={() => onStatusClick(status)}
            className={`shrink-0 rounded-2xl px-5 py-4 text-left border transition-all min-w-[140px] shadow-sm ${isActive
              ? 'bg-gray-900 border-gray-900'
              : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className={`text-2xl font-bold tracking-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
              {count}
            </div>
            <div className="mt-1.5">
              {isActive ? (
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{status}</span>
              ) : (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${bg}`}
                  style={{ color }}
                >
                  {status}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}