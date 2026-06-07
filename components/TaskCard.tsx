'use client'

import { Microtask } from '@/lib/types'

interface TaskCardProps {
  task: Microtask
  index: number
  done: boolean
  onToggle: (index: number) => void
}

export default function TaskCard({ task, index, done, onToggle }: TaskCardProps) {
  return (
    <div
      className={`flex items-start gap-4 bg-white border rounded-2xl px-5 py-4 transition-all ${
        done ? 'border-gray-100 opacity-50' : 'border-gray-200 hover:border-indigo-200'
      }`}
    >
      <button
        onClick={() => onToggle(index)}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          done
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {done && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 ${done ? 'line-through' : ''}`}>
          {task.title}
        </p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
            {task.action_verb}
          </span>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">
            {task.duration} min
          </span>
        </div>
      </div>

      <span className="text-xs text-gray-300 font-medium mt-1 flex-shrink-0">#{index + 1}</span>
    </div>
  )
}
