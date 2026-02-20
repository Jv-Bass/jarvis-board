'use client'

import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/supabase'

export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const columnColor = STATUS_COLORS[status] || '#3a3a5a'
  const label = STATUS_LABELS[status] || status

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-4 rounded-t-lg"
        style={{ backgroundColor: `${columnColor}30`, borderTop: `3px solid ${columnColor}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(status)}</span>
          <h3 className="font-orbitron font-semibold text-sm">{label}</h3>
        </div>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: columnColor, color: '#000' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 bg-jarvis-bg/50 rounded-b-lg min-h-[200px] transition-all duration-200 overflow-y-auto ${
          isOver ? 'drop-target' : ''
        }`}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-jarvis-muted text-sm">
            {isOver ? 'Drop here' : 'No tasks'}
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusIcon(status) {
  const icons = {
    backlog: '📥',
    this_week: '📅',
    doing: '⚡',
    blocked: '🚫',
    done: '✅',
  }
  return icons[status] || '📋'
}
