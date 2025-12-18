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
import { Moon, Sun, Monitor, Globe, Bell, Download, Upload, Trash2, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const t = useTranslations('settings')
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

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </header>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('theme')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-5 w-5" />
            <span className="text-xs">{t('themeDark')}</span>
          </Button>
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-5 w-5" />
            <span className="text-xs">{t('themeLight')}</span>
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => setTheme('system')}
          >
            <Monitor className="h-5 w-5" />
            <span className="text-xs">{t('themeSystem')}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            {t('language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant={locale === 'pt-BR' ? 'default' : 'outline'}
            onClick={() => handleLocaleChange('pt-BR')}
          >
            Português
          </Button>
          <Button
            variant={locale === 'en-US' ? 'default' : 'outline'}
            onClick={() => handleLocaleChange('en-US')}
          >
            English
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            {t('notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">{t('notificationsEnabled')}</Label>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Week starts on */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('weekStartsOn')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant={weekStartsOn === 0 ? 'default' : 'outline'}
            onClick={() => setWeekStartsOn(0)}
          >
            {t('sunday')}
          </Button>
          <Button
            variant={weekStartsOn === 1 ? 'default' : 'outline'}
            onClick={() => setWeekStartsOn(1)}
          >
            {t('monday')}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('data')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 lg:flex-row lg:gap-4">
          <Button
            variant="outline"
            className="justify-start lg:flex-1"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('exportData')}
          </Button>
          <Button
            variant="outline"
            className="justify-start lg:flex-1"
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
          <Separator className="my-2 lg:hidden" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="justify-start lg:flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deleteAllData')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os seus hábitos, tarefas,
                  métricas e configurações serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      </div>

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
