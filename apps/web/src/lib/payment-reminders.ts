import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction, Task } from '@/types'
import { tasksService } from '@/services/tasks.service'
import { areasService } from '@/services/areas.service'
import { calculateNextRecurrenceDate, getTodayString } from '@/lib/finances'

const FINANCES_AREA_SLUG = 'finances'

/**
 * Calculates the proper due date for a payment reminder task.
 * Always calculates based on transaction date to ensure correctness,
 * regardless of what's stored in recurrence.nextDate (which may be corrupted).
 */
function calculatePaymentDueDate(transaction: Transaction): string {
  const today = getTodayString()

  // If transaction date is today or in the future, use it (first payment)
  if (transaction.date >= today) {
    return transaction.date
  }

  // Calculate the next occurrence from the original date
  // by advancing until we reach a future date
  if (transaction.recurrence?.frequency) {
    let nextDate = transaction.date

    // Advance the date until it's in the future (or today)
    let iterations = 0
    while (nextDate < today && iterations < 100) { // Safety limit
      nextDate = calculateNextRecurrenceDate(nextDate, transaction.recurrence.frequency)
      iterations++
    }

    return nextDate
  }

  // Fallback to today if no frequency is set
  return today
}

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

  // Calculate the proper due date
  const dueDate = calculatePaymentDueDate(transaction)

  // Also update the transaction's recurrence_next_date to fix any corrupted values
  // This ensures consistency between the task and the transaction
  await supabase
    .from('transactions')
    .update({ recurrence_next_date: dueDate })
    .eq('id', transaction.id)

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
