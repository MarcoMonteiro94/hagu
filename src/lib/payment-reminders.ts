import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction, Task } from '@/types'
import { tasksService } from '@/services/tasks.service'
import { areasService } from '@/services/areas.service'

const FINANCES_AREA_SLUG = 'finances'

/**
 * Creates a payment reminder task for a recurring expense transaction.
 * Returns null if a task already exists for this transaction (to prevent duplicates).
 */
export async function createPaymentReminderTask(
  supabase: SupabaseClient,
  transaction: Transaction
): Promise<Task | null> {
  // Only create tasks for recurring expenses
  if (transaction.type !== 'expense' || !transaction.isRecurring || !transaction.recurrence) {
    return null
  }

  // Check if a non-done task already exists for this transaction
  const existingTask = await tasksService.getByLinkedTransactionId(supabase, transaction.id)
  if (existingTask) {
    return null // Task already exists, don't create duplicate
  }

  // Get the finances area
  const financesArea = await areasService.getBySlug(supabase, FINANCES_AREA_SLUG)

  // Calculate due date from recurrence
  const dueDate = transaction.recurrence.nextDate || transaction.date

  // Create the task
  const task = await tasksService.create(supabase, {
    title: `💰 ${transaction.description}`,
    description: undefined,
    projectId: undefined,
    areaId: financesArea?.id,
    dueDate,
    priority: 'medium',
    status: 'pending',
    tags: ['payment', 'recurring'],
    estimatedMinutes: undefined,
    recurrence: undefined, // Task is not recurring - we create new ones when completed
    linkedTransactionId: transaction.id,
    completedAt: undefined,
  })

  return task
}

/**
 * Creates payment reminder tasks for all recurring expenses that don't have an active task.
 * Used for migrating existing recurring expenses.
 */
export async function createMissingPaymentReminders(
  supabase: SupabaseClient,
  recurringExpenses: Transaction[]
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const expense of recurringExpenses) {
    const task = await createPaymentReminderTask(supabase, expense)
    if (task) {
      created++
    } else {
      skipped++
    }
  }

  return { created, skipped }
}

/**
 * Creates the next payment reminder task when a recurring expense task is completed.
 * Should be called when a task linked to a transaction is marked as done.
 */
export async function createNextPaymentReminder(
  supabase: SupabaseClient,
  completedTask: Task,
  transaction: Transaction
): Promise<Task | null> {
  if (!completedTask.linkedTransactionId || !transaction.isRecurring || !transaction.recurrence) {
    return null
  }

  // Only create if there's a next date and it's before the end date
  const nextDate = transaction.recurrence.nextDate
  if (!nextDate) {
    return null
  }

  if (transaction.recurrence.endDate && nextDate > transaction.recurrence.endDate) {
    return null
  }

  // Get the finances area
  const financesArea = await areasService.getBySlug(supabase, FINANCES_AREA_SLUG)

  // Create the next task
  const task = await tasksService.create(supabase, {
    title: `💰 ${transaction.description}`,
    description: undefined,
    projectId: undefined,
    areaId: financesArea?.id,
    dueDate: nextDate,
    priority: 'medium',
    status: 'pending',
    tags: ['payment', 'recurring'],
    estimatedMinutes: undefined,
    recurrence: undefined,
    linkedTransactionId: transaction.id,
    completedAt: undefined,
  })

  return task
}
