import { Job, JobStats } from '@/types/job'
import { STATUS_COLORS } from '@/lib/constants'

interface Props {
  stats: JobStats
  activeStatus: string
  onStatusClick: (status: string) => void
}

export default function StatCards({ stats, activeStatus, onStatusClick }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={() => onStatusClick('')}
        className={`rounded-xl p-4 text-left border transition-all min-w-[120px] ${activeStatus === ''
          ? 'border-gray-400 shadow-sm bg-white'
          : 'border-transparent bg-gray-100 hover:bg-gray-200'
          }`}
      >
        <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-500 mt-1 whitespace-nowrap">Total</div>
      </button>

      {Object.entries(stats.by_status).map(([status, count]) => {
        const color = STATUS_COLORS[status] ?? STATUS_COLORS.default
        const isActive = activeStatus === status
        return (
          <button
            key={status}
            onClick={() => onStatusClick(status)}
            className={`rounded-xl p-4 text-left border transition-all min-w-[180px] ${isActive ? 'border-gray-400 shadow-sm bg-white' : 'border-transparent bg-gray-100 hover:bg-gray-200'
              }`}
          >
            <div className="text-2xl font-semibold text-gray-900">{count}</div>
            <div className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>
              {status}
            </div>
          </button>
        )
      })}
    </div>
  )
}