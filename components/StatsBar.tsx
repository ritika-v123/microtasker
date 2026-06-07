'use client'

interface StatsBarProps {
  total: number
  totalMinutes: number
  done: number
}

export default function StatsBar({ total, totalMinutes, done }: StatsBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{total}</p>
          <p className="text-xs text-gray-400 mt-0.5">tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{totalMinutes}</p>
          <p className="text-xs text-gray-400 mt-0.5">min total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-indigo-600">{done}</p>
          <p className="text-xs text-gray-400 mt-0.5">done</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">{pct}% complete</p>
    </div>
  )
}
