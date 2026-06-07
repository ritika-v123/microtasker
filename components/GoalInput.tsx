'use client'

interface GoalInputProps {
  onGenerate: (goal: string) => void
  loading: boolean
}

export default function GoalInput({ onGenerate, loading }: GoalInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const goal = (form.elements.namedItem('goal') as HTMLInputElement).value.trim()
    if (goal) onGenerate(goal)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        name="goal"
        type="text"
        placeholder="e.g. Learn Docker, Plan a road trip, Write a business plan…"
        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating…
          </>
        ) : (
          <>✦ Generate</>
        )}
      </button>
    </form>
  )
}
