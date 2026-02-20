'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, pointerWithin, closestCenter } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import Sidebar from '@/components/Sidebar'
import KanbanColumn from '@/components/KanbanColumn'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import { supabase, STATUSES } from '@/lib/supabase'

const COLUMNS = [STATUSES.BACKLOG, STATUSES.THIS_WEEK, STATUSES.DOING, STATUSES.BLOCKED, STATUSES.DONE]

export default function KanbanPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('status')
      .order('position', { ascending: true })

    if (!error && data) {
      setTasks(data)
    }
    setLoading(false)
  }

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id
    const newStatus = over.id

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Get tasks in the destination column
    const destTasks = tasks.filter(t => t.status === newStatus && t.id !== taskId)
    
    // Calculate new position (top of column = 0, next = 10, etc.)
    const newPosition = destTasks.length > 0 
      ? Math.min(...destTasks.map(t => t.position || 0)) - 10 
      : 0

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: newStatus, 
            position: newPosition,
            moved_to_doing_at: newStatus === 'doing' ? new Date().toISOString() : t.moved_to_doing_at 
          } 
        : t
    ))

    // Database update
    const updates = {
      status: newStatus,
      position: newPosition,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'doing' && !task.moved_to_doing_at) {
      updates.moved_to_doing_at = new Date().toISOString()
    }

    await supabase.from('tasks').update(updates).eq('id', taskId)

    // Log activity
    await supabase.from('activity_log').insert({
      task_id: taskId,
      action: 'status_changed',
      details: { from: task.status, to: newStatus, position: newPosition }
    })

    // WIP LIMIT ENFORCEMENT: If moved to "doing", ensure only 1
    if (newStatus === 'doing') {
      await enforceWIPLimit()
    }
  }

  const enforceWIPLimit = async () => {
    const doingTasks = tasks.filter(t => t.status === 'doing' && t.id !== activeTask?.id)
    
    if (doingTasks.length > 0) {
      // Keep the topmost (lowest position number), move others to This Week
      const sorted = [...doingTasks].sort((a, b) => (a.position || 0) - (b.position || 0))
      const keep = sorted[0]
      const moveOthers = sorted.slice(1)

      for (const task of moveOthers) {
        await supabase
          .from('tasks')
          .update({ status: 'this_week', updated_at: new Date().toISOString() })
          .eq('id', task.id)

        await supabase.from('activity_log').insert({
          task_id: task.id,
          action: 'wip_limit_enforced',
          details: { reason: 'More than 1 in Doing' }
        })
      }
    }
  }

  const handleTaskClick = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const handleSaveTask = async (taskData) => {
    if (taskData.id) {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskData.id)

      if (!error) {
        await supabase.from('activity_log').insert({
          task_id: taskData.id,
          action: 'task_updated',
          details: taskData,
        })
      }
    } else {
      // Get max position for new task
      const backlogTasks = tasks.filter(t => t.status === 'backlog')
      const maxPos = backlogTasks.length > 0 
        ? Math.max(...backlogTasks.map(t => t.position || 0)) + 10 
        : 0

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          ...taskData, 
          created_by: 'boss',
          position: maxPos
        }])
        .select()
        .single()

      if (!error && data) {
        await supabase.from('activity_log').insert({
          task_id: data.id,
          action: 'task_created',
          details: taskData,
        })
      }
    }

    setModalOpen(false)
    setEditingTask(null)
  }

  const handleDeleteTask = async (taskId) => {
    if (confirm('Delete this task?')) {
      await supabase.from('tasks').delete().eq('id', taskId)
      setModalOpen(false)
      setEditingTask(null)
    }
  }

  const getTasksByStatus = (status) => {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }

  const getTaskCounts = () => {
    const counts = {}
    COLUMNS.forEach(col => {
      counts[col] = tasks.filter(t => t.status === col).length
    })
    return counts
  }

  return (
    <div className="min-h-screen bg-jarvis-bg">
      <Sidebar taskCounts={getTaskCounts()} />

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-white">Kanban Board</h1>
            <p className="text-jarvis-muted mt-1">Drag cards to update status • Click to edit</p>
          </div>
          <button onClick={handleCreateTask} className="btn btn-primary">
            + New Task
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jarvis-cyan"></div>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={getTasksByStatus(status)}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setModalOpen(false)
            setEditingTask(null)
          }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  )
}
