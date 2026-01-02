'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTransition } from '@/components/ui/motion'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectFormDialog } from '@/components/projects/project-form-dialog'
import { useProjectsWithProgress } from '@/hooks/queries/use-projects'
import type { ProjectStatus } from '@/types'
import {
  Rocket,
  Target,
  Flag,
  TrendingUp,
  CheckCircle2,
  Clock,
  Pause,
  Archive,
  Plus,
  LayoutGrid,
  List,
} from 'lucide-react'

type ViewMode = 'grid' | 'list'

function getOverallProgress(
  projects: Array<{ progress: number; status: string }>
): number {
  const activeProjects = projects.filter((p) => p.status === 'active')
  if (activeProjects.length === 0) return 0
  const totalProgress = activeProjects.reduce((sum, p) => sum + p.progress, 0)
  return Math.round(totalProgress / activeProjects.length)
}

export default function ProjectsPage() {
  const router = useRouter()
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')

  const [activeTab, setActiveTab] = useState<ProjectStatus | 'all'>('active')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data: allProjects = [], isLoading } = useProjectsWithProgress()

  const activeProjects = allProjects.filter((p) => p.status === 'active')
  const pausedProjects = allProjects.filter((p) => p.status === 'paused')
  const completedProjects = allProjects.filter((p) => p.status === 'completed')
  const archivedProjects = allProjects.filter((p) => p.status === 'archived')

  const filteredProjects =
    activeTab === 'all'
      ? allProjects
      : allProjects.filter((p) => p.status === activeTab)

  const overallProgress = getOverallProgress(allProjects)
  const totalObjectives = allProjects.reduce((sum, p) => sum + p.objectivesCount, 0)
  const completedObjectives = allProjects.reduce(
    (sum, p) => sum + p.completedObjectivesCount,
    0
  )
  const upcomingMilestonesCount = allProjects.reduce(
    (sum, p) => sum + p.upcomingMilestones.length,
    0
  )

  const handleProjectClick = (projectId: string) => {
    router.push(`/areas/projects/${projectId}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Rocket className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <ProjectFormDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addNew')}
            </Button>
          </ProjectFormDialog>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Overall Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-2xl font-bold">{overallProgress}%</span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{t('overallProgress')}</p>
              <Progress value={overallProgress} className="mt-1 h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Rocket className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-2xl font-bold">{activeProjects.length}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{t('activeProjects')}</p>
              <p className="text-xs text-muted-foreground">
                {pausedProjects.length} {t('paused')} · {completedProjects.length}{' '}
                {t('completedCount')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-2xl font-bold">
                {completedObjectives}/{totalObjectives}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{t('objectivesCompleted')}</p>
              <Progress
                value={totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0}
                className="mt-1 h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Milestones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Flag className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-2xl font-bold">{upcomingMilestonesCount}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{t('upcomingMilestones')}</p>
              <p className="text-xs text-muted-foreground">{t('nextDays', { days: 30 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Project List */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            {t('statusTabs.all')} ({allProjects.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Rocket className="h-4 w-4" />
            {t('statusTabs.active')} ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="paused" className="gap-2">
            <Pause className="h-4 w-4" />
            {t('statusTabs.paused')} ({pausedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {t('statusTabs.completed')} ({completedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="h-4 w-4" />
            {t('statusTabs.archived')} ({archivedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Rocket className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">{t('noProjects')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t('noProjectsDescription')}</p>
                <ProjectFormDialog>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createFirst')}
                  </Button>
                </ProjectFormDialog>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <Rocket className="h-5 w-5" style={{ color: project.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>
                          {project.completedObjectivesCount}/{project.objectivesCount}
                        </span>
                      </div>
                      <div className="w-24">
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      <span className="w-12 text-right font-medium">{project.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
