'use client'

import { Microtask } from '@/lib/types'
import TaskCard from './TaskCard'

interface TaskListProps {
  tasks: Microtask[]
  completedSet: Set<number>
  onToggle: (index: number) => void
}

export default function TaskList({ tasks, completedSet, onToggle }: TaskListProps) {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task, i) => (
        <TaskCard
          key={i}
          task={task}
          index={i}
          done={completedSet.has(i)}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
