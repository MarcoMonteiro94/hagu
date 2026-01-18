// Services exports
// Note: Services receive SupabaseClient as dependency injection for platform flexibility

export * from './habits.service'
export * from './tasks.service'
export * from './projects.service'
export * from './areas.service'
export * from './notebooks.service'
export * from './finances.service'
export * from './gamification.service'
export * from './settings.service'
// push.service is web-specific (uses web-push), keep it in apps/web
