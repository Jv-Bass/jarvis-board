// Jarvis-Board Background Worker - STRICT RULES
// Priority = Vertical Order (position field)
// Exactly ONE in "Currently Doing" at all times
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || ''

export async function POST(request) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      timestamp: new Date().toISOString(),
      actions: [],
      errors: [],
    }

    // RULE: Get all tasks ordered by position (top = highest priority)
    const { data: allTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['backlog', 'this_week', 'doing', 'blocked', 'done'])
      .order('status')
      .order('position', { ascending: true })

    if (fetchError) {
      results.errors.push(`Fetch error: ${fetchError.message}`)
      return NextResponse.json(results, { status: 500 })
    }

    // Separate tasks by status
    const doingTasks = allTasks.filter(t => t.status === 'doing')
    const thisWeekTasks = allTasks.filter(t => t.status === 'this_week')
    const backlogTasks = allTasks.filter(t => t.status === 'backlog')
    const blockedTasks = allTasks.filter(t => t.status === 'blocked')

    // RULE: WIP LIMIT - Exactly ONE in "Currently Doing"
    if (doingTasks.length > 1) {
      // Keep topmost (first), move others back to This Week
      const keepTask = doingTasks[0]
      const moveTasks = doingTasks.slice(1)

      for (const task of moveTasks) {
        await supabase
          .from('tasks')
          .update({ status: 'this_week', updated_at: new Date().toISOString() })
          .eq('id', task.id)

        await supabase.from('activity_log').insert({
          task_id: task.id,
          action: 'wip_limit_enforced',
          details: { reason: 'More than 1 in Doing', moved_to: 'this_week' }
        })

        results.actions.push({ task: task.title, action: 'moved_to_this_week', reason: 'WIP limit' })
      }
    }

    // Get fresh list after WIP enforcement
    const { data: freshTasks } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['doing', 'this_week', 'backlog'])
      .order('status')
      .order('position', { ascending: true })

    const freshDoing = freshTasks.filter(t => t.status === 'doing')
    const freshThisWeek = freshTasks.filter(t => t.status === 'this_week')
    const freshBacklog = freshTasks.filter(t => t.status === 'backlog')

    // RULE: If "Currently Doing" is empty, pull next highest priority
    if (freshDoing.length === 0) {
      // Priority: This Week > Backlog
      let nextTask = null

      if (freshThisWeek.length > 0) {
        nextTask = freshThisWeek[0] // Topmost in This Week
        results.actions.push({ from: 'this_week', task: nextTask.title, action: 'auto_started' })
      } else if (freshBacklog.length > 0) {
        nextTask = freshBacklog[0] // Topmost in Backlog
        results.actions.push({ from: 'backlog', task: nextTask.title, action: 'auto_started' })
      }

      if (nextTask) {
        await supabase
          .from('tasks')
          .update({
            status: 'doing',
            moved_to_doing_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', nextTask.id)

        await supabase.from('activity_log').insert({
          task_id: nextTask.id,
          action: 'task_auto_started',
          details: { source: nextTask.status }
        })

        // Send notification
        await sendNotification({
          type: 'task_started',
          task: nextTask.title,
        })
      }
    }

    // Check aging for tasks in "Doing"
    const { data: currentDoing } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'doing')

    const agingThreshold = 4 // hours

    for (const task of currentDoing || []) {
      if (task.moved_to_doing_at) {
        const hoursInStatus = (Date.now() - new Date(task.moved_to_doing_at).getTime()) / (1000 * 60 * 60)

        if (hoursInStatus > agingThreshold) {
          results.actions.push({
            task: task.title,
            action: 'aging_alert',
            hours: hoursInStatus.toFixed(1)
          })

          await sendNotification({
            type: 'aging',
            task: task.title,
            hours: hoursInStatus.toFixed(1)
          })
        }
      }
    }

    // Check blocked tasks
    const { data: currentBlocked } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'blocked')

    const blockedThreshold = 1 // hours

    for (const task of currentBlocked || []) {
      if (task.updated_at) {
        const hoursBlocked = (Date.now() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60)

        if (hoursBlocked > blockedThreshold) {
          results.actions.push({
            task: task.title,
            action: 'still_blocked',
            hours: hoursBlocked.toFixed(1)
          })

          await sendNotification({
            type: 'still_blocked',
            task: task.title,
            reason: task.blocker_reason,
            hours: hoursBlocked.toFixed(1)
          })
        }
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendNotification({ type, task, hours, reason }) {
  if (!DISCORD_WEBHOOK) return

  const messages = {
    aging: `⚠️ **Task Aging Alert**\n"${task}" has been in progress for ${hours} hours!`,
    still_blocked: `🚫 **Still Blocked**\n"${task}" - ${reason || 'No reason'} (${hours}h)`,
    task_started: `▶️ **New Task Started**\nWorking on: "${task}"`,
  }

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: messages[type] || `Update: ${task}` }),
    })
  } catch (e) {
    console.error('Notification failed:', e)
  }
}
