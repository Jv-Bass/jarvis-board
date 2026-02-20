'use client'

import { useState, useEffect } from 'react'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/supabase'

const TAG_OPTIONS = ['frontend', 'backend', 'bug', 'feature', 'research', 'deployment', 'documentation', 'testing']

export default function TaskModal({ task, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expectations: '',
    priority: 3,
    status: 'backlog',
    due_date: '',
    blocker_reason: '',
    tags: [],
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        expectations: task.expectations || '',
        priority: task.priority || 3,
        status: task.status || 'backlog',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        blocker_reason: task.blocker_reason || '',
        tags: task.tags || [],
      })
    }
  }, [task])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: task?.id,
    })
  }

  const toggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-jarvis-panel border border-jarvis-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-jarvis-border">
          <h2 className="font-orbitron font-bold text-xl text-jarvis-cyan">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-jarvis-muted hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm text-jarvis-muted mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full"
              required
              placeholder="Task title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-jarvis-muted mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 resize-none"
              placeholder="What needs to be done?"
            />
          </div>

          {/* Expectations */}
          <div>
            <label className="block text-sm text-jarvis-muted mb-2">Acceptance Criteria</label>
            <textarea
              value={formData.expectations}
              onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
              className="w-full h-24 resize-none"
              placeholder="How will we know it's done?"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-jarvis-muted mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-jarvis-muted mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm text-jarvis-muted mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Blocker Reason */}
          {formData.status === 'blocked' && (
            <div>
              <label className="block text-sm text-jarvis-pink mb-2">🚫 Blocker Reason</label>
              <textarea
                value={formData.blocker_reason}
                onChange={(e) => setFormData({ ...formData, blocker_reason: e.target.value })}
                className="w-full h-20 resize-none border-jarvis-pink"
                placeholder="What are we waiting for?"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm text-jarvis-muted mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-jarvis-cyan text-jarvis-bg'
                      : 'bg-jarvis-bg text-jarvis-muted border border-jarvis-border'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-jarvis-border">
            <div>
              {task && (
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
