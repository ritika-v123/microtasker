import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// PATCH — toggle is_completed on a microtask, then sync plan's completed_tasks count
export async function PATCH(req: NextRequest) {
  try {
    const { id, is_completed } = await req.json()

    if (!id || typeof is_completed !== 'boolean') {
      return NextResponse.json({ error: 'id and is_completed are required' }, { status: 400 })
    }

    // Update the microtask
    const { data: task, error: taskError } = await supabase
      .from('microtasks')
      .update({ is_completed })
      .eq('id', id)
      .select('plan_id')
      .single()

    if (taskError) throw taskError

    // Recount completed tasks for this plan
    const { data: allTasks, error: countError } = await supabase
      .from('microtasks')
      .select('is_completed')
      .eq('plan_id', task.plan_id)

    if (countError) throw countError

    const completed_tasks = allTasks.filter((t: { is_completed: boolean }) => t.is_completed).length

    await supabase
      .from('microtask_plans')
      .update({ completed_tasks })
      .eq('id', task.plan_id)

    return NextResponse.json({ ok: true, completed_tasks })
  } catch (error) {
    console.error('Toggle error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
