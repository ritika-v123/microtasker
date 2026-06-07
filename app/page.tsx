'use client'

import { useState } from 'react'
import Link from 'next/link'
import GoalInput from '@/components/GoalInput'
import StatsBar from '@/components/StatsBar'
import { Microtask, Plan } from '@/lib/types'

export default function Home() {
  const [tasks, setTasks] = useState<Microtask[]>([])       // unsaved, local only
  const [savedPlan, setSavedPlan] = useState<Plan | null>(null) // after save → DB-backed
  const [goal, setGoal] = useState('')
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  // ── Generate ──────────────────────────────────────────────
  const handleGenerate = async (g: string) => {
    setLoading(true)
    setError('')
    setTasks([])
    setCompletedSet(new Set())
    setSavedPlan(null)
    setGoal(g)
    setSavedMsg('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: g }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Assign local step numbers; is_completed starts false
      setTasks(data.tasks.map((t: Omit<Microtask, 'step' | 'is_completed'>, i: number) => ({
        ...t,
        step: i + 1,
        is_completed: false,
      })))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle before save (local state only) ────────────────
  const handleLocalToggle = (index: number) => {
    setCompletedSet(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
    setTasks(prev => prev.map((t, i) =>
      i === index ? { ...t, is_completed: !t.is_completed } : t
    ))
  }

  // ── Toggle after save (persists to DB, optimistic UI) ────
  const handleDbToggle = async (task: Microtask) => {
    if (!task.id) return
    const newVal = !task.is_completed

    // Optimistic update
    setSavedPlan(prev => {
      if (!prev) return prev
      const microtasks = prev.microtasks!.map(t =>
        t.id === task.id ? { ...t, is_completed: newVal } : t
      )
      return { ...prev, microtasks, completed_tasks: microtasks.filter(t => t.is_completed).length }
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
      setSavedPlan(prev => {
        if (!prev) return prev
        const microtasks = prev.microtasks!.map(t =>
          t.id === task.id ? { ...t, is_completed: task.is_completed } : t
        )
        return { ...prev, microtasks, completed_tasks: microtasks.filter(t => t.is_completed).length }
      })
    }
  }

  // ── Save plan → insert to DB → reload with real IDs ──────
  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, tasks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Fetch the saved plan with real microtask UUIDs from DB
      const planRes = await fetch(`/api/plans/${data.plan.id}`)
      const planData = await planRes.json()
      setSavedPlan(planData.plan)
      setTasks([]) // switch to DB-backed view
      setSavedMsg('Saved! Toggles now sync to database.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Derived values ────────────────────────────────────────
  const isSaved = !!savedPlan
  const activeTasks: Microtask[] = isSaved ? (savedPlan!.microtasks ?? []) : tasks
  const totalMinutes = activeTasks.reduce((a, t) => a + (t.duration || 7), 0)
  const doneCount = isSaved
    ? (savedPlan!.microtasks ?? []).filter(t => t.is_completed).length
    : completedSet.size

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Microtask planner</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Break any goal into 5–10 min steps</p>
          </div>
          <Link href="/plans" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap flex-shrink-0">
            Saved plans →
          </Link>
        </div>

        {/* Goal input */}
        <div className="mb-6">
          <GoalInput onGenerate={handleGenerate} loading={loading} />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        {loading && (
          <div className="text-center py-16 text-sm text-gray-400">Generating your plan with Gemini…</div>
        )}

        {/* Plan view */}
        {activeTasks.length > 0 && (
          <>
            <div className="mb-4">
              <StatsBar total={activeTasks.length} totalMinutes={totalMinutes} done={doneCount} />
            </div>

            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-medium text-gray-700 truncate">
                  Plan: <span className="text-indigo-600">{goal}</span>
                </h2>
                {isSaved && (
                  <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Saved — toggles sync to database automatically
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {savedMsg && <span className="text-xs text-green-600 font-medium">{savedMsg}</span>}
                {!isSaved && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-sm px-4 py-2 border border-gray-300 text-gray-800 bg-white rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? 'Saving…' : '↑ Save plan'}
                  </button>
                )}
                {isSaved && (
                  <Link
                    href={`/plans/${savedPlan!.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View full details →
                  </Link>
                )}
              </div>
            </div>

            {/* Task list */}
            <div className="flex flex-col gap-3">
              {activeTasks.map((task, i) => (
                <div
                  key={task.id ?? i}
                  className={`flex items-start gap-3 sm:gap-4 bg-white border rounded-2xl px-4 sm:px-5 py-4 transition-all ${
                    task.is_completed ? 'border-gray-100 opacity-50' : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <button
                    onClick={() => isSaved ? handleDbToggle(task) : handleLocalToggle(i)}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.is_completed
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {task.is_completed && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 leading-snug ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">{task.action_verb}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium">{task.duration} min</span>
                      {task.is_completed && (
                        <span className="text-xs bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full font-medium">✓ done</span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-gray-300 font-medium mt-1 flex-shrink-0 hidden sm:block">
                    #{task.step ?? i + 1}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && activeTasks.length === 0 && !error && (
          <div className="text-center py-16 sm:py-20">
            <p className="text-4xl mb-4">✦</p>
            <p className="text-sm text-gray-400">Enter any goal above to generate your plan</p>
          </div>
        )}
      </div>
    </main>
  )
}
