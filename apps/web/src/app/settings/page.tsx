'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useSettingsStore } from '@/stores/settings'
import { downloadData, importData, clearAllData } from '@/lib/data'
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '@/lib/notifications'
import { Moon, Sun, Monitor, Globe, Bell, Download, Upload, Trash2, Loader2, LogOut, User, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { user, signOut } = useAuth()
  const {
    theme,
    locale,
    notificationsEnabled,
    weekStartsOn,
    setTheme,
    setLocale,
    setNotificationsEnabled,
    setWeekStartsOn,
  } = useSettingsStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleLocaleChange = (newLocale: 'pt-BR' | 'en-US') => {
    setLocale(newLocale)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    window.location.reload()
  }

  const handleExport = () => {
    try {
      downloadData()
      toast.success('Dados exportados com sucesso!')
    } catch {
      toast.error('Erro ao exportar dados')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const result = await importData(file)

    if (result.success) {
      toast.success('Dados importados com sucesso! Recarregando...')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      toast.error(result.error || 'Erro ao importar dados')
    }

    setIsImporting(false)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteAllData = () => {
    clearAllData()
    toast.success('Todos os dados foram excluídos! Recarregando...')
    setTimeout(() => window.location.reload(), 1500)
  }

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!isNotificationSupported()) {
        toast.error('Notificações não são suportadas neste navegador')
        return
      }

      const permission = await requestNotificationPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        toast.success('Notificações ativadas!')
      } else if (permission === 'denied') {
        toast.error('Permissão de notificações negada. Verifique as configurações do navegador.')
      } else {
        toast.info('Permissão de notificações não concedida')
      }
    } else {
      setNotificationsEnabled(false)
      toast.success('Notificações desativadas')
    }
  }

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 pb-24 lg:max-w-4xl lg:p-6 lg:pb-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalize sua experiência no Hagu
        </p>
      </header>

      {/* Settings Grid */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      {/* Theme */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{t('theme')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="flex flex-col gap-2 h-auto py-4 rounded-xl transition-all"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-5 w-5" />
            <span className="text-xs font-medium">{t('themeDark')}</span>
          </Button>
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            className="flex flex-col gap-2 h-auto py-4 rounded-xl transition-all"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-5 w-5" />
            <span className="text-xs font-medium">{t('themeLight')}</span>
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            className="flex flex-col gap-2 h-auto py-4 rounded-xl transition-all"
            onClick={() => setTheme('system')}
          >
            <Monitor className="h-5 w-5" />
            <span className="text-xs font-medium">{t('themeSystem')}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
              <Globe className="h-5 w-5 text-info" />
            </div>
            <CardTitle className="text-lg">{t('language')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant={locale === 'pt-BR' ? 'default' : 'outline'}
            onClick={() => handleLocaleChange('pt-BR')}
            className="rounded-xl"
          >
            🇧🇷 Português
          </Button>
          <Button
            variant={locale === 'en-US' ? 'default' : 'outline'}
            onClick={() => handleLocaleChange('en-US')}
            className="rounded-xl"
          >
            🇺🇸 English
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Bell className="h-5 w-5 text-warning" />
            </div>
            <CardTitle className="text-lg">{t('notifications')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div>
              <Label htmlFor="notifications" className="font-medium">{t('notificationsEnabled')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Receba lembretes dos seus hábitos</p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Week starts on */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <CardTitle className="text-lg">{t('weekStartsOn')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant={weekStartsOn === 0 ? 'default' : 'outline'}
            onClick={() => setWeekStartsOn(0)}
            className="rounded-xl"
          >
            {t('sunday')}
          </Button>
          <Button
            variant={weekStartsOn === 1 ? 'default' : 'outline'}
            onClick={() => setWeekStartsOn(1)}
            className="rounded-xl"
          >
            {t('monday')}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{t('data')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:gap-4">
          <Button
            variant="outline"
            className="justify-start lg:flex-1 rounded-xl h-11"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('exportData')}
          </Button>
          <Button
            variant="outline"
            className="justify-start lg:flex-1 rounded-xl h-11"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {t('importData')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Separator className="my-1 lg:hidden" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="justify-start lg:flex-1 rounded-xl h-11">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deleteAllData')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os seus hábitos, tarefas,
                  métricas e configurações serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                >
                  Excluir tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      </div>

      {/* Account */}
      {user && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              {t('account')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate max-w-[200px]">{user.email}</span>
            </div>
            <Separator />
            <Button
              variant="destructive"
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('version')}</span>
            <span>0.1.0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
