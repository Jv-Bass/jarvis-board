// Background worker API - runs on Vercel cron
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Discord webhook for notifications
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || ''

export async function POST(request) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      checked: 0,
      actions: [],
      errors: [],
    }

    // 1. Find tasks in "doing" status
    const { data: doingTasks, error: doingError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'doing')

    if (doingError) {
      results.errors.push(`Error fetching doing tasks: ${doingError.message}`)
    } else {
      results.checked += doingTasks.length

      // Check for aging tasks
      const agingThreshold = 4 // hours
      for (const task of doingTasks) {
        if (task.moved_to_doing_at) {
          const hoursInStatus = (Date.now() - new Date(task.moved_to_doing_at).getTime()) / (1000 * 60 * 60)
          
          if (hoursInStatus > agingThreshold) {
            results.actions.push({
              task: task.title,
              action: 'aging_alert',
              hours: hoursInStatus.toFixed(1),
            })
            
            // Send notification (would integrate with Discord in production)
            await sendNotification({
              type: 'aging',
              task: task.title,
              hours: hoursInStatus.toFixed(1),
            })
          }
        }
      }
    }

    // 2. Find tasks in "blocked" status
    const { data: blockedTasks, error: blockedError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'blocked')

    if (blockedError) {
      results.errors.push(`Error fetching blocked tasks: ${blockedError.message}`)
    } else {
      results.checked += blockedTasks.length

      // Check for long-blocked tasks
      const blockedThreshold = 1 // hours
      for (const task of blockedTasks) {
        if (task.updated_at) {
          const hoursInStatus = (Date.now() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60)
          
          if (hoursInStatus > blockedThreshold) {
            results.actions.push({
              task: task.title,
              action: 'still_blocked',
              reason: task.blocker_reason,
              hours: hoursInStatus.toFixed(1),
            })

            await sendNotification({
              type: 'still_blocked',
              task: task.title,
              reason: task.blocker_reason,
              hours: hoursInStatus.toFixed(1),
            })
          }
        }
      }
    }

    // 3. Auto-start next task if nothing in "doing"
    if (!doingTasks || doingTasks.length === 0) {
      // Find highest priority task that's not done
      const { data: nextTask } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['backlog', 'this_week'])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (nextTask) {
        await supabase
          .from('tasks')
          .update({
            status: 'doing',
            moved_to_doing_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', nextTask.id)

        results.actions.push({
          task: nextTask.title,
          action: 'auto_started',
        })

        await sendNotification({
          type: 'task_started',
          task: nextTask.title,
        })
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

async function sendNotification({ type, task, hours, reason }) {
  if (!DISCORD_WEBHOOK) return

  const messages = {
    aging: `⚠️ **Task Aging Alert**\n"${task}" has been in progress for ${hours} hours!`,
    still_blocked: `🚫 **Still Blocked**\n"${task}" - ${reason || 'No reason provided'} (${hours}h)`,
    task_started: `▶️ **New Task Started**\nWorking on: "${task}"`,
  }

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: messages[type] || `Task update: ${task}`,
      }),
    })
  } catch (e) {
    console.error('Failed to send notification:', e)
  }
}
