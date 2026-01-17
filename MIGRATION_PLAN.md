# Plano de Migração Hagu → React Native

> Documento gerado em: Janeiro 2026
> Status: Planejamento

---

## Resumo das Decisões

| Aspecto | Decisão |
|---------|---------|
| **Framework** | Expo (Managed Workflow) |
| **Plataformas** | iOS + Android |
| **Estratégia** | Monorepo (web + mobile compartilhando código) |
| **Styling** | NativeWind (Tailwind para RN) |
| **UI Library** | Gluestack UI |
| **Prioridade Features** | 1º Tarefas + Projetos, 2º Finanças |
| **Ferramentas** | Claude Code + Vibed (PLANNER, BUILDER, DESIGNER) |
| **Notebooks/Estudos** | Deixar para fase final |

---

## Arquitetura Atual (Web)

### Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS 4
- **State**: Zustand + React Query
- **Backend**: Supabase (PostgreSQL + Auth)
- **i18n**: next-intl (pt-BR, en-US)
- **Rich Text**: BlockNote
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit
- **Animações**: Framer Motion

### Features Principais
1. **Hábitos** - tracking diário/semanal, streaks, heatmaps
2. **Tarefas** - CRUD, subtarefas, recorrência, prioridades
3. **Projetos** - objetivos, milestones, métricas
4. **Estudos** - notebooks com editor rich text
5. **Finanças** - transações, orçamentos, metas
6. **Saúde** - peso, métricas, evolução
7. **Gamificação** - XP, níveis, achievements
8. **Pomodoro** - timer customizável

### Código Reutilizável (~60-70%)
- ✅ Toda a camada de **services** (lógica de negócio)
- ✅ Todos os **types** TypeScript
- ✅ **React Query** hooks (lógica de queries)
- ✅ **Zustand** stores
- ✅ Integração **Supabase** (auth + database)
- ✅ Estrutura de **i18n**

### Código a Reescrever
- ❌ Componentes UI (shadcn/ui → Gluestack UI)
- ❌ Estilização (Tailwind → NativeWind)
- ❌ Editor rich text (BlockNote → TBD)
- ❌ Charts (Recharts → victory-native)
- ❌ Drag & Drop (@dnd-kit → reanimated)
- ❌ Navegação (App Router → Expo Router)

---

## Estrutura do Monorepo

```
hagu/
├── apps/
│   ├── web/                    # Next.js atual
│   │   ├── src/
│   │   │   ├── app/           # Pages (App Router)
│   │   │   ├── components/    # UI components (shadcn)
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── mobile/                 # Expo app (novo)
│       ├── app/               # Screens (Expo Router)
│       ├── components/        # UI components (Gluestack)
│       └── package.json
│
├── packages/
│   ├── core/                   # Código compartilhado
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── habits.ts
│   │   │   ├── tasks.ts
│   │   │   ├── projects.ts
│   │   │   ├── finances.ts
│   │   │   ├── gamification.ts
│   │   │   └── ...
│   │   ├── types/             # TypeScript types
│   │   │   ├── habits.ts
│   │   │   ├── tasks.ts
│   │   │   └── ...
│   │   ├── hooks/             # React Query hooks
│   │   │   ├── use-habits.ts
│   │   │   ├── use-tasks.ts
│   │   │   └── ...
│   │   ├── stores/            # Zustand stores
│   │   │   ├── settings.ts
│   │   │   └── pomodoro.ts
│   │   ├── lib/               # Utilities
│   │   │   ├── supabase.ts
│   │   │   ├── dates.ts
│   │   │   └── currency.ts
│   │   └── package.json
│   │
│   ├── ui-web/                # Web-only UI (opcional)
│   └── ui-mobile/             # Mobile-only UI (opcional)
│
├── package.json               # Workspaces config (pnpm)
├── pnpm-workspace.yaml        # pnpm workspace definition
├── turbo.json                 # Turborepo config
└── tsconfig.base.json         # Shared TS config
```

---

## Fases de Implementação

### Fase 0: Setup do Monorepo (1-2 dias)

#### Tarefas
- [ ] Inicializar Turborepo na raiz do projeto
- [ ] Configurar pnpm workspaces
- [ ] Criar `apps/web` e mover código Next.js atual
- [ ] Criar `packages/core` e extrair código compartilhável:
  - [ ] Mover `services/` para `packages/core/services/`
  - [ ] Mover `types/` para `packages/core/types/`
  - [ ] Mover `stores/` para `packages/core/stores/`
  - [ ] Mover `lib/` para `packages/core/lib/`
  - [ ] Adaptar hooks para serem platform-agnostic
- [ ] Atualizar imports no app web
- [ ] Verificar que app web continua funcionando
- [ ] Criar `apps/mobile` com Expo

#### Comandos
```bash
# Na raiz do hagu
pnpm init
pnpm add -D turbo

# Criar estrutura
mkdir -p apps/web apps/mobile packages/core
```

---

### Fase 1: Fundação Mobile (3-5 dias)

#### 1.1 Setup Expo
```bash
cd apps/mobile
npx create-expo-app . --template blank-typescript
```

#### 1.2 Dependências Base
```bash
# Navegação
npx expo install expo-router react-native-screens react-native-safe-area-context

# NativeWind
pnpm add nativewind tailwindcss
pnpm add -D tailwindcss

# Gluestack UI
pnpm add @gluestack-ui/themed @gluestack-style/react

# Supabase
pnpm add @supabase/supabase-js expo-secure-store

# State
pnpm add @tanstack/react-query zustand

# Utils
pnpm add expo-localization react-i18next i18next
```

#### 1.3 Configurações
- [ ] `tailwind.config.js` para NativeWind
- [ ] `babel.config.js` com NativeWind preset
- [ ] Gluestack provider setup
- [ ] Supabase client para mobile (com secure storage)
- [ ] React Query provider
- [ ] i18n setup

#### 1.4 Autenticação Mobile
- [ ] Login screen
- [ ] Signup screen
- [ ] Auth callback handling
- [ ] Protected routes (Expo Router groups)
- [ ] Session persistence com secure-store

#### Vibed Resources
- **Agent**: BUILDER
- **Skill**: Expo
- **MCP**: Supabase

---

### Fase 2: Tarefas + Projetos (1-2 semanas)

#### 2.1 Screens de Tarefas
- [ ] `app/(tabs)/tasks/index.tsx` - Lista de tarefas
- [ ] `app/(tabs)/tasks/[id].tsx` - Detalhe/edição
- [ ] `app/(tabs)/tasks/create.tsx` - Criação (ou modal)

#### 2.2 Componentes de Tarefas
| Componente | Descrição |
|------------|-----------|
| `TaskCard` | Card pressable com status, prioridade, due date |
| `TaskList` | FlatList com pull-to-refresh |
| `TaskForm` | Formulário de criação/edição |
| `SubtaskList` | Lista de subtarefas com checkbox |
| `PriorityBadge` | Badge visual de prioridade |
| `DueDatePicker` | Date picker com expo-date-picker |

#### 2.3 Funcionalidades
- [ ] CRUD completo de tarefas
- [ ] Filtros por status, prioridade, área
- [ ] Swipe actions (complete, delete)
- [ ] Pull-to-refresh
- [ ] Ordenação (drag to reorder)
- [ ] Subtarefas
- [ ] Recorrência

#### 2.4 Screens de Projetos
- [ ] `app/(tabs)/projects/index.tsx` - Lista de projetos
- [ ] `app/(tabs)/projects/[id].tsx` - Detalhe do projeto
- [ ] `app/(tabs)/projects/[id]/objectives.tsx` - Objetivos
- [ ] `app/(tabs)/projects/[id]/milestones.tsx` - Milestones

#### 2.5 Componentes de Projetos
| Componente | Descrição |
|------------|-----------|
| `ProjectCard` | Card com progress e status |
| `ObjectiveList` | Lista de objetivos |
| `MilestoneItem` | Item de milestone com checkbox |
| `ProgressRing` | Indicador circular de progresso |

---

### Fase 3: Finanças (1-2 semanas)

#### 3.1 Screens
- [ ] `app/(tabs)/finances/index.tsx` - Dashboard
- [ ] `app/(tabs)/finances/transactions.tsx` - Lista de transações
- [ ] `app/(tabs)/finances/budgets.tsx` - Orçamentos
- [ ] `app/(tabs)/finances/goals.tsx` - Metas financeiras

#### 3.2 Componentes
| Componente | Descrição |
|------------|-----------|
| `TransactionCard` | Card com valor, categoria, data |
| `TransactionList` | SectionList agrupado por data |
| `TransactionForm` | Modal de criação |
| `CategoryPicker` | Seletor de categoria |
| `BudgetCard` | Card de orçamento com progresso |
| `GoalCard` | Card de meta com contribuições |
| `SpendingChart` | Gráfico de gastos por categoria |
| `BalanceChart` | Gráfico de receita vs despesa |

#### 3.3 Charts
Usar **victory-native** ou **react-native-chart-kit**:
```bash
pnpm add victory-native react-native-svg
```

#### 3.4 Funcionalidades
- [ ] Adicionar transação (income/expense)
- [ ] Categorização
- [ ] Visualização mensal (swipe entre meses)
- [ ] Orçamentos por categoria
- [ ] Metas de economia
- [ ] Relatórios visuais

---

### Fase 4: Features Complementares (2-3 semanas)

#### 4.1 Hábitos + Gamificação
- [ ] Lista de hábitos
- [ ] Tracking diário
- [ ] Streak visualization
- [ ] Heatmap de completude
- [ ] XP e níveis
- [ ] Achievements com animações
- [ ] Pomodoro timer

#### 4.2 Áreas de Vida
- [ ] Overview das áreas
- [ ] Área de saúde (peso, métricas)
- [ ] Customização de áreas

#### 4.3 Estudos/Notebooks
> **Decisão**: Deixar para última fase
> **Opções**:
> - Markdown editor simples
> - react-native-pell-rich-editor
> - Webview com BlockNote (hybrid)

#### 4.4 Configurações
- [ ] Theme toggle
- [ ] Language selector
- [ ] Notificações
- [ ] Perfil do usuário

---

### Fase 5: Polish & Deploy (1 semana)

#### 5.1 UX/Performance
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Haptic feedback
- [ ] Animações (Reanimated)
- [ ] App icon
- [ ] Splash screen

#### 5.2 Notificações
```bash
npx expo install expo-notifications
```
- [ ] Push notifications setup
- [ ] Local reminders
- [ ] Badge counts

#### 5.3 Deploy
```bash
# EAS Build
npm install -g eas-cli
eas build:configure
```
- [ ] EAS Build setup
- [ ] App Store Connect config
- [ ] Google Play Console config
- [ ] Primeira build de teste
- [ ] Submissão para review

---

## Mapeamento de Dependências

| Web | Mobile | Notas |
|-----|--------|-------|
| `next` | `expo-router` | Navegação file-based |
| `tailwindcss` | `nativewind` | Mesmas classes |
| `shadcn/ui` | `@gluestack-ui/themed` | Similar API |
| `@radix-ui/*` | Gluestack primitives | Acessibilidade built-in |
| `framer-motion` | `react-native-reanimated` | Animações |
| `@dnd-kit` | `react-native-gesture-handler` | Drag & drop |
| `recharts` | `victory-native` | Charts |
| `blocknote` | TBD | Rich text |
| `sonner` | `react-native-toast-message` | Toasts |
| `next-themes` | NativeWind dark mode | Theming |
| `next-intl` | `react-i18next` | i18n |
| `web-push` | `expo-notifications` | Push |

---

## Vibed Resources

### Agents a Utilizar
| Agent | Uso |
|-------|-----|
| **PLANNER** | Revisão e refinamento da arquitetura |
| **BUILDER** | Implementação dos componentes e screens |
| **DESIGNER** | Design system e UI/UX |
| **iOS DESIGNER** | Otimizações específicas iOS |
| **DEPLOYER** | Setup de CI/CD e deploy |

### Skills
| Skill | Uso |
|-------|-----|
| **Expo** | Todo o desenvolvimento mobile |
| **Shadcn** | Referência para padrões UI |

### MCPs
| MCP | Uso |
|-----|-----|
| **Supabase** | Integração backend |
| **Firecrawl** | Pesquisa de docs/exemplos |

---

## Timeline Estimado

| Fase | Duração | Status |
|------|---------|--------|
| Fase 0: Monorepo | 1-2 dias | ✅ Concluída |
| Fase 1: Fundação | 3-5 dias | ✅ Concluída |
| Fase 2: Tarefas + Projetos | 1-2 semanas | ⏳ Pendente |
| Fase 3: Finanças | 1-2 semanas | ⏳ Pendente |
| Fase 4: Complementares | 2-3 semanas | ⏳ Pendente |
| Fase 5: Polish + Deploy | 1 semana | ⏳ Pendente |
| **Total** | **6-9 semanas** | |

---

## Checklist de Início

Antes de começar a implementação:

- [x] Fazer backup do código atual
- [x] Criar branch `feature/mobile-app`
- [ ] Garantir que testes passam no web atual
- [ ] Ter conta Apple Developer ($99/ano) para iOS
- [ ] Ter conta Google Play Console ($25 one-time) para Android
- [ ] Configurar EAS (Expo Application Services)
- [ ] Revisar design no Figma (se houver)

---

## Notas Adicionais

### Offline Support
Considerar implementar offline-first com:
- React Query persistence
- Supabase local-first (em beta)
- AsyncStorage para cache

### Performance
- Usar `useMemo` e `useCallback` apropriadamente
- Lazy loading de screens
- Image optimization com expo-image
- List virtualization (FlatList)

### Testing
- Unit tests com Jest
- Component tests com React Native Testing Library
- E2E com Detox ou Maestro

---

*Este documento será atualizado conforme o progresso da migração.*
