import type { TransactionCategory } from '@/types/finances'

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    nameKey: 'finances.categories.food',
    type: 'expense',
    icon: 'UtensilsCrossed',
    color: '#f97316', // orange-500
    isCustom: false,
  },
  {
    id: 'transport',
    name: 'Transportation',
    nameKey: 'finances.categories.transport',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6', // blue-500
    isCustom: false,
  },
  {
    id: 'housing',
    name: 'Housing',
    nameKey: 'finances.categories.housing',
    type: 'expense',
    icon: 'Home',
    color: '#a855f7', // purple-500
    isCustom: false,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    nameKey: 'finances.categories.entertainment',
    type: 'expense',
    icon: 'Gamepad2',
    color: '#ec4899', // pink-500
    isCustom: false,
  },
  {
    id: 'health',
    name: 'Health',
    nameKey: 'finances.categories.health',
    type: 'expense',
    icon: 'Heart',
    color: '#ef4444', // red-500
    isCustom: false,
  },
  {
    id: 'education',
    name: 'Education',
    nameKey: 'finances.categories.education',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#06b6d4', // cyan-500
    isCustom: false,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    nameKey: 'finances.categories.shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#eab308', // yellow-500
    isCustom: false,
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    nameKey: 'finances.categories.bills',
    type: 'expense',
    icon: 'FileText',
    color: '#6b7280', // gray-500
    isCustom: false,
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    nameKey: 'finances.categories.subscriptions',
    type: 'expense',
    icon: 'CreditCard',
    color: '#8b5cf6', // violet-500
    isCustom: false,
  },
  {
    id: 'other-expense',
    name: 'Other',
    nameKey: 'finances.categories.otherExpense',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#64748b', // slate-500
    isCustom: false,
  },
]

export const INCOME_CATEGORIES: TransactionCategory[] = [
  {
    id: 'salary',
    name: 'Salary',
    nameKey: 'finances.categories.salary',
    type: 'income',
    icon: 'Wallet',
    color: '#22c55e', // green-500
    isCustom: false,
  },
  {
    id: 'freelance',
    name: 'Freelance',
    nameKey: 'finances.categories.freelance',
    type: 'income',
    icon: 'Laptop',
    color: '#14b8a6', // teal-500
    isCustom: false,
  },
  {
    id: 'investments',
    name: 'Investments',
    nameKey: 'finances.categories.investments',
    type: 'income',
    icon: 'TrendingUp',
    color: '#10b981', // emerald-500
    isCustom: false,
  },
  {
    id: 'bonus',
    name: 'Bonus',
    nameKey: 'finances.categories.bonus',
    type: 'income',
    icon: 'Gift',
    color: '#f59e0b', // amber-500
    isCustom: false,
  },
  {
    id: 'other-income',
    name: 'Other',
    nameKey: 'finances.categories.otherIncome',
    type: 'income',
    icon: 'Banknote',
    color: '#84cc16', // lime-500
    isCustom: false,
  },
]

export const ALL_CATEGORIES: TransactionCategory[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
]

export const PAYMENT_METHODS = [
  { id: 'cash', nameKey: 'finances.paymentMethods.cash', icon: 'Banknote' },
  { id: 'credit', nameKey: 'finances.paymentMethods.credit', icon: 'CreditCard' },
  { id: 'debit', nameKey: 'finances.paymentMethods.debit', icon: 'CreditCard' },
  { id: 'pix', nameKey: 'finances.paymentMethods.pix', icon: 'Smartphone' },
  { id: 'transfer', nameKey: 'finances.paymentMethods.transfer', icon: 'ArrowRightLeft' },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']

export function getCategoryById(id: string): TransactionCategory | undefined {
  return ALL_CATEGORIES.find((cat) => cat.id === id)
}

export function getCategoriesByType(type: 'income' | 'expense'): TransactionCategory[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
