export interface Microtask {
  id?: string
  plan_id?: string
  step: number
  title: string
  description: string
  action_verb: string
  duration: number
  is_completed: boolean
}

export interface Plan {
  id: string
  goal: string
  created_at: string
  total_tasks: number
  total_minutes: number
  completed_tasks: number
  microtasks?: Microtask[]
}
