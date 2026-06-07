'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import StatsBar from '@/components/StatsBar'
import { Plan, Microtask } from '@/lib/types'

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setPlan(d.plan)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleToggle = async (task: Microtask) => {
    if (!task.id || toggling) return
    const newVal = !task.is_completed
    setToggling(task.id)

    // Optimistic update
    setPlan(prev => {
      if (!prev) return prev
      const microtasks = prev.microtasks!.map(t =>
        t.id === task.id ? { ...t, is_completed: newVal } : t
      )
      return {
        ...prev,
        microtasks,
        completed_tasks: microtasks.filter(t => t.is_completed).length,
      }
    })

    try {
      const res = await fetch('/api/microtasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, is_completed: newVal }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on failure
      setPlan(prev => {
        if (!prev) return prev
        const microtasks = prev.microtasks!.map(t =>
          t.id === task.id ? { ...t, is_completed: task.is_completed } : t
        )
        return {
          ...prev,
          microtasks,
          completed_tasks: microtasks.filter(t => t.is_completed).length,
        }
      })
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading plan…</p>
      </main>
    )
  }

  if (error || !plan) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl mb-4">
            {error || 'Plan not found'}
          </div>
          <Link href="/plans" className="text-sm text-indigo-600">← Back to plans</Link>
        </div>
      </main>
    )
  }

  const microtasks = plan.microtasks ?? []
  const totalMinutes = microtasks.reduce((a, t) => a + (t.duration || 7), 0)
  const doneCount = microtasks.filter(t => t.is_completed).length

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/plans" className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-block">
              ← All plans
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{plan.goal}</h1>
            <p className="text-xs text-gray-400 mt-1">
              Saved {new Date(plan.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <Link href="/" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap flex-shrink-0">
            New plan
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsBar total={microtasks.length} totalMinutes={totalMinutes} done={doneCount} />
        </div>

        {/* Sync indicator */}
        <p className="text-xs text-green-600 mb-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Click any task to toggle completion — changes save automatically
        </p>

        {/* Task list */}
        <div className="flex flex-col gap-3">
          {microtasks.map((task, i) => (
            <button
              key={task.id ?? i}
              onClick={() => handleToggle(task)}
              disabled={toggling === task.id}
              className={`w-full text-left flex items-start gap-3 sm:gap-4 bg-white border rounded-2xl px-4 sm:px-5 py-4 transition-all ${
                task.is_completed
                  ? 'border-gray-100 opacity-50'
                  : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
              } ${toggling === task.id ? 'cursor-wait' : 'cursor-pointer'}`}
            >
              {/* Check circle */}
              <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.is_completed
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-gray-300'
              }`}>
                {task.is_completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${
                  task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'
                }`}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                    {task.action_verb}
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">
                    {task.duration} min
                  </span>
                  {task.is_completed && (
                    <span className="text-xs bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full font-medium">
                      ✓ completed
                    </span>
                  )}
                </div>
              </div>

              {/* Step number */}
              <span className="text-xs text-gray-300 font-medium mt-1 flex-shrink-0 hidden sm:block">
                #{task.step ?? i + 1}
              </span>
            </button>
          ))}
        </div>

        {microtasks.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-400">No tasks found for this plan.</div>
        )}
      </div>
    </main>
  )
}
