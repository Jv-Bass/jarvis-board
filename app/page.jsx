'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, pointerWithin } from '@dnd-kit/core'
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

    // Subscribe to realtime changes
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)))
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTasks(data)
    }
    setLoading(false)
  }

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id
    const newStatus = over.id

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              moved_to_doing_at: newStatus === 'doing' ? new Date().toISOString() : t.moved_to_doing_at,
            }
          : t
      )
    )

    // Update in database
    const updates = {
      status: newStatus,
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
      details: { from: task.status, to: newStatus },
    })
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
      // Update existing task
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
      // Create new task
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, created_by: 'boss' }])
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
    if (confirm('Are you sure you want to delete this task?')) {
      await supabase.from('tasks').delete().eq('id', taskId)
      setModalOpen(false)
      setEditingTask(null)
    }
  }

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => t.status === status)
  }

  const getTaskCounts = () => {
    const counts = {}
    COLUMNS.forEach((col) => {
      counts[col] = tasks.filter((t) => t.status === col).length
    })
    return counts
  }

  return (
    <div className="min-h-screen bg-jarvis-bg">
      <Sidebar taskCounts={getTaskCounts()} />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-white">Kanban Board</h1>
            <p className="text-jarvis-muted mt-1">Drag cards to update status • Click to edit</p>
          </div>
          <button onClick={handleCreateTask} className="btn btn-primary">
            + New Task
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jarvis-cyan"></div>
          </div>
        ) : (
          /* Kanban Board */
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((status) => (
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

      {/* Task Modal */}
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
