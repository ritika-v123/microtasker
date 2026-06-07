'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plan } from '@/lib/types'

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setPlans(d.plans)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return
    try {
      const res = await fetch(`/api/plans?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Saved plans</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Link href="/" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap flex-shrink-0">
            ← New plan
          </Link>
        </div>

        {loading && <div className="text-center py-16 text-sm text-gray-400">Loading plans…</div>}
        {error && <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>}

        {!loading && plans.length === 0 && !error && (
          <div className="text-center py-16 sm:py-20">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm text-gray-400">No plans saved yet.</p>
            <Link href="/" className="text-sm text-indigo-600 mt-2 inline-block">Generate your first plan →</Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {plans.map(plan => {
            const microtasks = plan.microtasks ?? []
            const done = microtasks.filter(t => t.is_completed).length
            const total = plan.total_tasks ?? microtasks.length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <div key={plan.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

                {/* Plan summary */}
                <div className="px-4 sm:px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{plan.goal}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {total} tasks · {plan.total_minutes} min ·{' '}
                        {new Date(plan.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Open →
                      </Link>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{done}/{total} done</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
