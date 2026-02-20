// Simple password-based auth API
import { NextResponse } from 'next/server'

// In-memory session store (for demo - use Redis/DB in production)
const sessions = new Map()

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'jarvis2026'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, password } = body

    if (action === 'login') {
      if (password === AUTH_PASSWORD) {
        const sessionId = Math.random().toString(36).substring(2)
        sessions.set(sessionId, { createdAt: Date.now() })
        
        return NextResponse.json({ 
          success: true, 
          sessionId,
          message: 'Authenticated successfully' 
        })
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 401 })
    }

    if (action === 'logout') {
      const sessionId = body.sessionId
      if (sessionId) {
        sessions.delete(sessionId)
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'verify') {
      const sessionId = body.sessionId
      const session = sessions.get(sessionId)
      
      if (session && Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ valid: true })
      }
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Auth API running',
    timestamp: new Date().toISOString()
  })
}
