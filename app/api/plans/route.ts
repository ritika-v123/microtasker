import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// POST — create plan + insert microtasks into separate table
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goal, tasks } = body

    if (!goal || !tasks?.length) {
      return NextResponse.json({ error: 'Goal and tasks are required' }, { status: 400 })
    }

    const total_minutes = tasks.reduce(
      (sum: number, t: { duration: number }) => sum + (t.duration || 7), 0
    )
    const completed_tasks = tasks.filter((t: { is_completed: boolean }) => t.is_completed).length

    // 1. Insert plan row (no tasks column)
    const { data: plan, error: planError } = await supabase
      .from('microtask_plans')
      .insert({ goal, total_tasks: tasks.length, total_minutes, completed_tasks })
      .select()
      .single()

    if (planError) throw planError

    // 2. Insert each microtask linked by plan_id
    const microtaskRows = tasks.map((t: {
      title: string
      description: string
      action_verb: string
      duration: number
      is_completed: boolean
    }, i: number) => ({
      plan_id: plan.id,
      step: i + 1,
      title: t.title,
      description: t.description,
      action_verb: t.action_verb,
      duration: t.duration || 7,
      is_completed: t.is_completed ?? false,
    }))

    const { error: tasksError } = await supabase
      .from('microtasks')
      .insert(microtaskRows)

    if (tasksError) throw tasksError

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
  }
}

// GET — fetch all plans with their microtasks joined
export async function GET() {
  try {
    const { data: plans, error } = await supabase
      .from('microtask_plans')
      .select(`*, microtasks ( id, plan_id, step, title, description, action_verb, duration, is_completed )`)
      .order('created_at', { ascending: false })

    if (error) throw error

    const sorted = plans.map((p: { microtasks?: { step: number }[] }) => ({
      ...p,
      microtasks: (p.microtasks ?? []).sort(
        (a: { step: number }, b: { step: number }) => a.step - b.step
      ),
    }))

    return NextResponse.json({ plans: sorted })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// DELETE — delete a plan by id (microtasks cascade)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 })
    }

    const { error } = await supabase.from('microtask_plans').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'Plan deleted' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
