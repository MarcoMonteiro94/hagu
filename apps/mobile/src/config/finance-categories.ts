import type { TransactionCategory } from '@hagu/core'

export const EXPENSE_CATEGORIES: Omit<TransactionCategory, 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    nameKey: 'finances.categories.food',
    type: 'expense',
    icon: 'utensils',
    color: '#f97316', // orange-500
    isCustom: false,
  },
  {
    id: 'transport',
    name: 'Transportation',
    nameKey: 'finances.categories.transport',
    type: 'expense',
    icon: 'car',
    color: '#3b82f6', // blue-500
    isCustom: false,
  },
  {
    id: 'housing',
    name: 'Housing',
    nameKey: 'finances.categories.housing',
    type: 'expense',
    icon: 'home',
    color: '#a855f7', // purple-500
    isCustom: false,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    nameKey: 'finances.categories.entertainment',
    type: 'expense',
    icon: 'gamepad',
    color: '#ec4899', // pink-500
    isCustom: false,
  },
  {
    id: 'health',
    name: 'Health',
    nameKey: 'finances.categories.health',
    type: 'expense',
    icon: 'heart',
    color: '#ef4444', // red-500
    isCustom: false,
  },
  {
    id: 'education',
    name: 'Education',
    nameKey: 'finances.categories.education',
    type: 'expense',
    icon: 'book',
    color: '#06b6d4', // cyan-500
    isCustom: false,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    nameKey: 'finances.categories.shopping',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#eab308', // yellow-500
    isCustom: false,
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    nameKey: 'finances.categories.bills',
    type: 'expense',
    icon: 'file-text',
    color: '#6b7280', // gray-500
    isCustom: false,
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    nameKey: 'finances.categories.subscriptions',
    type: 'expense',
    icon: 'credit-card',
    color: '#8b5cf6', // violet-500
    isCustom: false,
  },
  {
    id: 'other-expense',
    name: 'Other',
    nameKey: 'finances.categories.other-expense',
    type: 'expense',
    icon: 'more-horizontal',
    color: '#64748b', // slate-500
    isCustom: false,
  },
]

export const INCOME_CATEGORIES: Omit<TransactionCategory, 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'salary',
    name: 'Salary',
    nameKey: 'finances.categories.salary',
    type: 'income',
    icon: 'wallet',
    color: '#22c55e', // green-500
    isCustom: false,
  },
  {
    id: 'freelance',
    name: 'Freelance',
    nameKey: 'finances.categories.freelance',
    type: 'income',
    icon: 'laptop',
    color: '#14b8a6', // teal-500
    isCustom: false,
  },
  {
    id: 'investments',
    name: 'Investments',
    nameKey: 'finances.categories.investments',
    type: 'income',
    icon: 'trending-up',
    color: '#10b981', // emerald-500
    isCustom: false,
  },
  {
    id: 'bonus',
    name: 'Bonus',
    nameKey: 'finances.categories.bonus',
    type: 'income',
    icon: 'gift',
    color: '#f59e0b', // amber-500
    isCustom: false,
  },
  {
    id: 'other-income',
    name: 'Other',
    nameKey: 'finances.categories.other-income',
    type: 'income',
    icon: 'banknote',
    color: '#84cc16', // lime-500
    isCustom: false,
  },
]

export const ALL_DEFAULT_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
]

export function getCategoryById(id: string) {
  return ALL_DEFAULT_CATEGORIES.find((cat) => cat.id === id)
}

export function getCategoriesByType(type: 'income' | 'expense') {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
