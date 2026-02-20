'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { STATUSES, STATUS_LABELS } from '@/lib/supabase'

const navItems = [
  { id: 'kanban', label: 'Kanban Board', icon: '📋' },
  { id: 'this-week', label: 'This Week', icon: '📅' },
  { id: 'aging', label: 'Aging', icon: '⏰' },
  { id: 'calendar', label: 'Calendar', icon: '🗓️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ taskCounts = {} }) {
  const pathname = usePathname()
  
  const getCurrentPage = () => {
    if (pathname === '/') return 'kanban'
    return pathname.replace('/', '')
  }

  const currentPage = getCurrentPage()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-jarvis-panel border-r border-jarvis-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-jarvis-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-jarvis-cyan to-blue-600 flex items-center justify-center animate-pulse-glow">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="font-orbitron font-bold text-lg text-jarvis-cyan">JARVIS</h1>
            <p className="text-xs text-jarvis-muted">Task Board</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.id === 'kanban' ? '/' : `/${item.id}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-jarvis-cyan/10 text-jarvis-cyan border border-jarvis-cyan/30'
                    : 'text-jarvis-muted hover:bg-jarvis-bg hover:text-jarvis-text'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-rajdhani font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-jarvis-bg rounded-lg border border-jarvis-border">
          <h3 className="font-orbitron text-xs text-jarvis-muted mb-3">QUICK STATS</h3>
          <div className="space-y-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-jarvis-muted">{label}</span>
                <span className="font-orbitron font-bold" style={{ color: getStatusColor(key) }}>
                  {taskCounts[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-jarvis-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jarvis-green to-emerald-600 flex items-center justify-center">
            <span className="text-sm">🦞</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Clawdette</p>
            <p className="text-xs text-jarvis-muted">AI Assistant</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function getStatusColor(status) {
  const colors = {
    backlog: '#3a3a5a',
    this_week: '#ffaa00',
    doing: '#00d4ff',
    blocked: '#ff3366',
    done: '#00ff88',
  }
  return colors[status] || '#8888aa'
}
