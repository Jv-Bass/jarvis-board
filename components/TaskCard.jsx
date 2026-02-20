'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/supabase'
import { format } from 'date-fns'

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[3]
  const priorityLabel = PRIORITY_LABELS[task.priority] || 'P3'

  const getTimeInStatus = () => {
    if (!task.moved_to_doing_at) return null
    const diff = Date.now() - new Date(task.moved_to_doing_at).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const timeInStatus = getTimeInStatus()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-jarvis-panel border border-jarvis-border rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all duration-200 card-hover ${
        isDragging ? 'dragging opacity-50' : ''
      }`}
      style={{
        ...style,
        borderLeft: `4px solid ${priorityColor}`,
      }}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-orbitron font-bold px-2 py-1 rounded"
          style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
        >
          {priorityLabel}
        </span>
        {timeInStatus && (
          <span className="text-xs text-jarvis-muted flex items-center gap-1">
            ⏱️ {timeInStatus}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-rajdhani font-semibold text-white mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-sm text-jarvis-muted mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded bg-jarvis-cyan/10 text-jarvis-cyan"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-jarvis-muted">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Due Date & Blocker */}
      <div className="flex items-center justify-between text-xs">
        {task.due_date && (
          <span className="text-jarvis-muted flex items-center gap-1">
            📅 {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
        {task.blocker_reason && (
          <span className="text-jarvis-pink flex items-center gap-1">
            🚫 Blocked
          </span>
        )}
      </div>

      {/* Test Log Preview (if done) */}
      {task.status === 'done' && task.test_log && task.test_log.length > 0 && (
        <div className="mt-3 pt-3 border-t border-jarvis-border">
          <div className="flex items-center gap-2 text-xs text-jarvis-green">
            <span>✅</span>
            <span>Tested {task.test_log.length}x</span>
          </div>
        </div>
      )}
    </div>
  )
}
