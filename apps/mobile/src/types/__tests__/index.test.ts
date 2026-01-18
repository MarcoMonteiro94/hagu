import {
  DEFAULT_HOME_WIDGETS,
  type WidgetSize,
  type HomeWidgetType,
  type HomeWidget,
  type UserStats,
  type Task,
  type Habit,
} from '../index'

describe('Types', () => {
  describe('DEFAULT_HOME_WIDGETS', () => {
    it('should have 5 default widgets', () => {
      expect(DEFAULT_HOME_WIDGETS).toHaveLength(5)
    })

    it('should have correct widget IDs', () => {
      const widgetIds = DEFAULT_HOME_WIDGETS.map((w) => w.id)
      expect(widgetIds).toContain('habits')
      expect(widgetIds).toContain('tasks')
      expect(widgetIds).toContain('health')
      expect(widgetIds).toContain('finances')
      expect(widgetIds).toContain('notebooks')
    })

    it('should have habits and tasks visible by default', () => {
      const habits = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'habits')
      const tasks = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'tasks')
      const notebooks = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'notebooks')

      expect(habits?.visible).toBe(true)
      expect(tasks?.visible).toBe(true)
      expect(notebooks?.visible).toBe(true)
    })

    it('should have health and finances hidden by default', () => {
      const health = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'health')
      const finances = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'finances')

      expect(health?.visible).toBe(false)
      expect(finances?.visible).toBe(false)
    })

    it('should have correct sizes', () => {
      const habits = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'habits')
      const tasks = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'tasks')
      const health = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'health')
      const finances = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'finances')
      const notebooks = DEFAULT_HOME_WIDGETS.find((w) => w.id === 'notebooks')

      expect(habits?.size).toBe('large')
      expect(tasks?.size).toBe('large')
      expect(health?.size).toBe('large')
      expect(finances?.size).toBe('wide')
      expect(notebooks?.size).toBe('wide')
    })

    it('should have ordered widgets', () => {
      const orders = DEFAULT_HOME_WIDGETS.map((w) => w.order)
      expect(orders).toEqual([0, 1, 2, 3, 4])
    })
  })

  describe('WidgetSize type', () => {
    it('should accept valid sizes', () => {
      const sizes: WidgetSize[] = ['small', 'medium', 'large', 'wide']
      expect(sizes).toHaveLength(4)
    })
  })

  describe('HomeWidgetType type', () => {
    it('should include all expected widget types', () => {
      const types: HomeWidgetType[] = [
        'habits',
        'tasks',
        'notebooks',
        'finances',
        'health',
        'stats',
      ]
      expect(types).toHaveLength(6)
    })
  })

  describe('HomeWidget interface', () => {
    it('should create valid widget object', () => {
      const widget: HomeWidget = {
        id: 'habits',
        visible: true,
        order: 0,
        size: 'large',
      }

      expect(widget.id).toBe('habits')
      expect(widget.visible).toBe(true)
      expect(widget.order).toBe(0)
      expect(widget.size).toBe('large')
    })

    it('should allow optional size', () => {
      const widget: HomeWidget = {
        id: 'tasks',
        visible: true,
        order: 1,
      }

      expect(widget.size).toBeUndefined()
    })
  })
})
