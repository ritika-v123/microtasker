import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET single plan with all microtasks
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: plan, error } = await supabase
      .from('microtask_plans')
      .select(`*, microtasks ( id, plan_id, step, title, description, action_verb, duration, is_completed )`)
      .eq('id', id)
      .single()

    if (error) throw error

    plan.microtasks = (plan.microtasks ?? []).sort(
      (a: { step: number }, b: { step: number }) => a.step - b.step
    )

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Fetch plan error:', error)
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }
}
