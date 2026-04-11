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
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
      <button
        onClick={() => onStatusClick('')}
        className={`rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 text-left border transition-all sm:min-w-[100px] ${activeStatus === ''
          ? 'bg-gray-900 border-gray-900 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
      >
        <div className={`text-xl sm:text-2xl font-bold tracking-tight ${activeStatus === '' ? 'text-white' : 'text-gray-900'}`}>
          {stats.total}
        </div>
        <div className={`text-xs mt-1 font-medium whitespace-nowrap ${activeStatus === '' ? 'text-gray-300' : 'text-gray-500'}`}>
          All applications
        </div>
      </button>

      {orderedStatuses.map(([status, count]) => {
        const { bg, color } = getStatusStyle(status)
        const isActive = activeStatus === status
        return (
          <button
            key={status}
            onClick={() => onStatusClick(status)}
            className={`rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 text-left border transition-all sm:min-w-[140px] shadow-sm ${isActive
              ? 'bg-gray-900 border-gray-900'
              : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className={`text-xl sm:text-2xl font-bold tracking-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
              {count}
            </div>
            <div className="mt-1.5">
              {isActive ? (
                <span className="text-xs font-medium text-gray-300 whitespace-nowrap">{status}</span>
              ) : (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${bg}`}
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