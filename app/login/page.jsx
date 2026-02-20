'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      })

      const data = await res.json()

      if (data.success) {
        // Set cookie
        document.cookie = `jarvis_session=${data.sessionId}; path=/; max-age=86400; SameSite=Strict`
        router.push('/')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Connection error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-jarvis-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-jarvis-cyan to-blue-600 flex items-center justify-center animate-pulse-glow">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-jarvis-cyan">JARVIS</h1>
          <p className="text-jarvis-muted mt-2">Task Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-jarvis-panel border border-jarvis-border rounded-xl p-8">
          <h2 className="font-orbitron text-xl font-semibold text-white mb-6 text-center">
            Enter Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-center text-lg"
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-jarvis-pink/10 border border-jarvis-pink/30 rounded-lg text-jarvis-pink text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Authenticating...
                </span>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-jarvis-muted text-sm mt-6">
          Protected by Jarvis Security System
        </p>
      </div>
    </div>
  )
}
