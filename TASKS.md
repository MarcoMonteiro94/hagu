# Hagu - Backlog de Tarefas

> Documento de tarefas para melhorias futuras do projeto.

---

## 1. Bulk Delete de Tasks

**Prioridade:** Média
**Complexidade:** Baixa
**Arquivos relacionados:**
- `/src/app/tasks/page.tsx`
- `/src/services/tasks.service.ts`
- `/src/hooks/queries/use-tasks.ts`

### Problema
Atualmente só é possível deletar tasks individualmente. Não existe funcionalidade para remover múltiplas tasks de uma vez.

### Estado Atual
- Deleção individual via `deleteTaskMutation.mutate(taskId)`
- Service só tem método `delete(id: string)` para uma task
- Sem UI para seleção múltipla (checkboxes)

### Solução Proposta
1. Adicionar método `deleteMany(ids: string[])` no `tasks.service.ts`
2. Criar mutation `useDeleteManyTasks` no hook
3. Adicionar UI com:
   - Checkbox em cada task para seleção
   - Botão "Selecionar todas"
   - Botão "Excluir selecionadas" com confirmação
   - Opcionalmente: "Excluir todas as concluídas"

### Critérios de Aceite
- [x] Usuário pode selecionar múltiplas tasks
- [x] Botão de delete em massa aparece quando há seleção
- [x] Confirmação antes de deletar
- [x] Feedback de sucesso/erro

---

## 2. Dialog de Criação de Task nas Páginas de Estudo

**Prioridade:** Alta
**Complexidade:** Média
**Arquivos relacionados:**
- `/src/app/areas/studies/[notebookId]/[pageId]/page.tsx`
- `/src/components/tasks/task-form-dialog.tsx` (criar ou adaptar)
- `/src/types/index.ts`

### Problema
Ao clicar em "Criar tarefa da página", a task é criada automaticamente com o título da página. O usuário deveria poder customizar a task antes de criar (ex: "Fazer exercícios do capítulo 1").

### Estado Atual
```typescript
// Criação automática sem customização
await createTaskMutation.mutateAsync({
  title: title.trim() || t('untitled'),
  description: descriptionText.slice(0, 500),
  status: 'pending',
  tags: ['from-notes'],
})
```

### Solução Proposta
1. Abrir dialog ao invés de criar diretamente
2. Pré-preencher campos com dados da página:
   - Título: sugestão baseada no título da página
   - Descrição: primeiros parágrafos
3. Permitir edição de:
   - Título customizado
   - Data de vencimento
   - Prioridade
   - Tags adicionais
4. Associar task à página (ver Task #3)

### Critérios de Aceite
- [ ] Clicar em "Criar tarefa" abre dialog
- [ ] Campos pré-preenchidos com dados da página
- [ ] Usuário pode editar todos os campos
- [ ] Task criada com associação à página/caderno

---

## 3. Associação de Tasks com Páginas e Cadernos

**Prioridade:** Alta
**Complexidade:** Alta
**Arquivos relacionados:**
- `/src/types/index.ts`
- `/src/services/tasks.service.ts`
- `/src/app/areas/studies/[notebookId]/page.tsx`
- `/src/app/areas/studies/[notebookId]/[pageId]/page.tsx`
- Supabase: tabela `tasks`

### Problema
Tasks criadas a partir de páginas não têm vínculo com a página/caderno de origem. Não há como ver quais tasks estão associadas a um caderno ou página.

### Estado Atual
- Interface `Task` não possui campos `notebookId` ou `pageId`
- Apenas tag `['from-notes']` indica origem
- Sem contador de tasks no caderno
- Sem lista de tasks na página

### Solução Proposta

#### 3.1 Atualizar Schema
```typescript
// types/index.ts
export interface Task {
  // ... campos existentes
  notebookId?: string    // NOVO
  pageId?: string        // NOVO
}
```

#### 3.2 Migration Supabase
```sql
ALTER TABLE tasks ADD COLUMN notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN page_id UUID REFERENCES notebook_pages(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_notebook_id ON tasks(notebook_id);
CREATE INDEX idx_tasks_page_id ON tasks(page_id);
```

#### 3.3 Exibir Tasks na Página
- Seção "Tarefas relacionadas" na página do editor
- Lista compacta com status e título
- Link para editar/completar task

#### 3.4 Contador no Caderno
- Badge com número de tasks pendentes
- Exibir no card do caderno e no header

### Critérios de Aceite
- [ ] Tasks podem ser vinculadas a notebooks/pages
- [ ] Página exibe lista de tasks associadas
- [ ] Caderno mostra contador de tasks pendentes
- [ ] Ao deletar página/caderno, tasks mantêm-se (SET NULL)

---

## 4. Correção da Função de Sequência (Streak)

**Prioridade:** Alta
**Complexidade:** Média
**Arquivos relacionados:**
- `/src/app/page.tsx` (home)
- `/src/components/shared/sidebar.tsx`
- `/src/services/gamification.service.ts`
- `/src/hooks/queries/use-gamification.ts`

### Problema
A sequência (streak) não está funcionando corretamente na home e na sidebar.

### Estado Atual
- Home exibe `currentStreak` do user stats (linha 184)
- Sidebar exibe `displayStreak` (linha 83)
- Cálculo está no serviço de gamificação
- Dados vêm da tabela `habit_streaks`

### Investigação Necessária
1. Verificar se `habit_streaks` está sendo atualizado corretamente
2. Checar se `updateStreakMutation` está funcionando
3. Validar lógica de cálculo de streak (dias consecutivos)
4. Testar se streak reseta corretamente quando dia é pulado

### Debugging
```typescript
// Adicionar logs para investigar
console.log('User stats:', { currentStreak, longestStreak, lastCompletedDate })
```

### Critérios de Aceite
- [ ] Streak incrementa ao completar hábito
- [ ] Streak reseta ao pular um dia
- [ ] Home e sidebar exibem mesmo valor
- [ ] Longest streak é atualizado quando current supera

---

## 5. Notificações de Achievements Repetidas

**Prioridade:** Alta
**Complexidade:** Média
**Arquivos relacionados:**
- `/src/components/achievements/achievement-provider.tsx`
- `/src/types/index.ts`
- `/src/services/gamification.service.ts`
- Supabase: tabela `achievements`

### Problema
Toda vez que a página é recarregada, as notificações de achievements aparecem novamente.

### Estado Atual
```typescript
// achievement-provider.tsx
const checkAndUnlock = useCallback(() => {
  // Verifica hasAchievement() mas pode ter timing issues
  if (hasAchievement(def.type)) continue

  if (shouldUnlock) {
    unlockAchievementMutation.mutate({ type: def.type })
    showAchievementToast({...}) // Sempre mostra!
  }
}, [...])
```

### Causa Raiz
1. Não há flag `notificationShown` no tipo Achievement
2. `previousRef.current` só persiste na sessão atual
3. Toast é mostrado junto com mutation, sem verificar se já foi exibido

### Solução Proposta

#### 5.1 Atualizar Interface
```typescript
// types/index.ts
export interface Achievement {
  id: string
  type: string
  unlockedAt: string
  notificationShown: boolean  // NOVO
  data?: Record<string, unknown>
}
```

#### 5.2 Migration Supabase
```sql
ALTER TABLE achievements ADD COLUMN notification_shown BOOLEAN DEFAULT FALSE;
```

#### 5.3 Atualizar Lógica
```typescript
// achievement-provider.tsx
const checkAndUnlock = useCallback(() => {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const existing = achievements.find(a => a.type === def.type)

    // Já tem e já mostrou notificação
    if (existing?.notificationShown) continue

    // Já tem mas não mostrou (reload)
    if (existing && !existing.notificationShown) {
      markNotificationShown(existing.id)
      continue // Não mostra de novo
    }

    // Novo achievement
    if (shouldUnlock) {
      unlockAchievementMutation.mutate({
        type: def.type,
        notificationShown: true
      })
      showAchievementToast({...})
    }
  }
}, [...])
```

### Critérios de Aceite
- [ ] Notificação aparece apenas uma vez por achievement
- [ ] Recarregar página não mostra notificações antigas
- [ ] Novos achievements ainda mostram notificação
- [ ] Flag persistida no banco de dados

---

## 6. Remover Quadro Kanban da Área de Tarefas

**Prioridade:** Baixa
**Complexidade:** Baixa
**Arquivos relacionados:**
- `/src/app/tasks/page.tsx`

### Problema
O quadro Kanban na página de tarefas não está sendo utilizado e adiciona complexidade desnecessária à interface.

### Estado Atual
- Página de tasks tem 3 views: List, Kanban, Calendar
- Kanban provavelmente implementado com tabs ou toggle

### Solução Proposta
1. Remover opção "Kanban" do seletor de views
2. Remover componente/código relacionado ao Kanban
3. Manter apenas List e Calendar como opções

### Critérios de Aceite
- [ ] Opção Kanban removida da UI
- [ ] Código do Kanban removido
- [ ] Views List e Calendar funcionando normalmente

---

## 7. Tarefas Não Aparecem no Calendário

**Prioridade:** Alta
**Complexidade:** Média
**Arquivos relacionados:**
- `/src/app/tasks/page.tsx`
- `/src/components/tasks/task-calendar.tsx` (ou similar)
- `/src/hooks/queries/use-tasks.ts`

### Problema
Ao selecionar uma data no calendário da página de tarefas, apenas os hábitos estão aparecendo. As tarefas com `dueDate` não são exibidas.

### Investigação Necessária
1. Verificar como o calendário filtra os dados
2. Checar se tasks com `dueDate` estão sendo passadas para o componente
3. Validar se o filtro por data está correto

### Solução Proposta
1. Garantir que tasks são filtradas por `dueDate` igual à data selecionada
2. Exibir tasks junto com hábitos na lista do dia
3. Diferenciar visualmente tasks de hábitos

### Critérios de Aceite
- [ ] Tasks com dueDate aparecem no calendário
- [ ] Ao clicar em uma data, tasks daquele dia são listadas
- [ ] Tasks e hábitos são diferenciados visualmente

---

## 8. Caderno Não Aparece Após Criação (Cache)

**Prioridade:** Alta
**Complexidade:** Baixa
**Arquivos relacionados:**
- `/src/hooks/queries/use-notebooks.ts`
- `/src/components/studies/notebook-form-dialog.tsx`

### Problema
Ao criar um novo caderno, ele não aparece na lista até que a página seja recarregada. Isso indica problema de invalidação de cache do React Query.

### Estado Atual
- Criação de notebook usa mutation
- Lista de notebooks usa query
- Cache provavelmente não está sendo invalidado após mutation

### Solução Proposta
```typescript
// use-notebooks.ts - Garantir invalidação
const createMutation = useMutation({
  mutationFn: (data) => notebooksService.create(supabase, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notebooks'] })
  },
})
```

### Critérios de Aceite
- [ ] Novo caderno aparece imediatamente após criação
- [ ] Não precisa recarregar página
- [ ] Cache é invalidado corretamente

---

## 9. Ordenação de Tasks por Data com Seções "Hoje" e "Próximas"

**Prioridade:** Alta
**Complexidade:** Média
**Arquivos relacionados:**
- `/src/app/tasks/page.tsx`
- `/src/hooks/queries/use-tasks.ts` (opcional)

### Problema
Tasks estão ordenadas por `order` (para drag-and-drop), mas deveriam priorizar ordenação por data. Além disso, falta separação visual entre tasks de hoje e próximas.

### Estado Atual
- Tasks ordenadas por coluna `order` do banco
- Todas as tasks pendentes em uma única lista
- Tasks com datas distantes (10/01) aparecem antes de tasks para hoje (01/01)

### Solução Proposta
1. Separar tasks pendentes em duas seções:
   - **Hoje**: tasks com `dueDate === hoje`
   - **Próximas**: tasks com `dueDate > hoje` ou sem data
2. Ordenar cada seção por data ascendente (mais próxima primeiro)
3. Manter drag-and-drop dentro de cada seção

```typescript
// Separação por seções
const today = getTodayString()
const todayTasks = pendingTasks.filter(t => t.dueDate === today)
const upcomingTasks = pendingTasks
  .filter(t => t.dueDate !== today)
  .sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
```

### Critérios de Aceite
- [x] Seção "Hoje" exibe tasks com dueDate de hoje
- [x] Seção "Próximas" exibe demais tasks ordenadas por data
- [x] Tasks sem data aparecem ao final
- [x] Seção "Atrasadas" exibe tasks com dueDate no passado

---

## 10. BalanceSummary Não Reflete Mês Selecionado

**Prioridade:** Alta
**Complexidade:** Baixa
**Arquivos relacionados:**
- `/src/app/areas/finances/page.tsx`
- `/src/components/finances/balance-summary.tsx`

### Problema
Ao selecionar um mês diferente (ex: Dezembro) na página de finanças, os cards de saldo, receitas e despesas continuam mostrando dados do mês atual ao invés do mês selecionado.

### Estado Atual
```typescript
// balance-summary.tsx - linha 22
const currentMonth = getCurrentMonth() // Sempre usa mês atual!
const { data: monthlyBalance } = useMonthlyBalance(currentMonth)

// finances/page.tsx - linha 146
<BalanceSummary /> // Não passa selectedMonth como prop
```

### Solução Proposta
1. Adicionar prop `month` ao componente `BalanceSummary`
2. Atualizar página de finanças para passar `selectedMonth`

```typescript
// balance-summary.tsx
interface BalanceSummaryProps {
  month?: string
}

export function BalanceSummary({ month }: BalanceSummaryProps) {
  const selectedMonth = month ?? getCurrentMonth()
  const { data: monthlyBalance } = useMonthlyBalance(selectedMonth)
  // ...
}

// finances/page.tsx
<BalanceSummary month={selectedMonth} />
```

### Critérios de Aceite
- [x] BalanceSummary aceita prop `month`
- [x] Cards refletem dados do mês selecionado
- [x] Ao mudar mês, cards atualizam automaticamente

---

## 11. Completar Tarefa de Pagamento Deve Gerar Despesa

**Prioridade:** Alta
**Complexidade:** Alta
**Arquivos relacionados:**
- `/src/services/tasks.service.ts` (setStatus)
- `/src/services/finances.service.ts`
- `/src/hooks/queries/use-tasks.ts`

### Problema
Quando uma tarefa de pagamento recorrente é marcada como concluída, ela:
- ✅ Cria próxima tarefa para o mês seguinte
- ❌ NÃO gera uma despesa real no mês atual

Isso significa que pagamentos marcados como "feitos" não aparecem no histórico de despesas.

### Estado Atual
```typescript
// tasks.service.ts - setStatus()
if (status === 'done' && currentTask.linkedTransactionId) {
  // Apenas cria próxima task e atualiza recurrence_next_date
  // NÃO cria transação de despesa para o mês atual
}
```

### Solução Proposta
1. Quando task de pagamento for completada:
   - Buscar transação recorrente vinculada
   - Criar nova transação de despesa com:
     - Mesmos dados (valor, categoria, descrição)
     - Data = `dueDate` da task completada
     - `isRecurring: false` (é uma instância, não template)
2. Atualizar UI para mostrar toast de confirmação

```typescript
// Ao completar task de pagamento
if (status === 'done' && currentTask.linkedTransactionId) {
  // Criar despesa para o mês
  await supabase.from('transactions').insert({
    ...transactionData, // copiar dados do template
    id: undefined, // novo ID
    date: currentTask.dueDate, // data do pagamento
    is_recurring: false, // instância única
    recurrence_frequency: null,
    recurrence_next_date: null,
    recurrence_end_date: null,
  })

  // Continuar com lógica existente (criar próxima task)
}
```

### Considerações
- Usuário pode querer confirmar valor (ex: conta de luz variável)
- Opcionalmente: abrir dialog para confirmar/editar valor
- MVP: usar valor do template diretamente

### Critérios de Aceite
- [x] Completar task de pagamento cria despesa no mês
- [x] Despesa aparece na lista de transações
- [x] Valor debita do saldo mensal
- [x] Next task ainda é criada para próximo mês

---

## Resumo

| # | Tarefa | Prioridade | Complexidade | Status |
|---|--------|------------|--------------|--------|
| 1 | Bulk Delete de Tasks | Média | Baixa | ✅ Concluído |
| 2 | Dialog de Criação de Task | Alta | Média | Pendente |
| 3 | Associação Tasks/Páginas | Alta | Alta | Pendente |
| 4 | Correção Streak | Alta | Média | ✅ Concluído |
| 5 | Notificações Achievements | Alta | Média | ✅ Concluído |
| 6 | Remover Kanban | Baixa | Baixa | ✅ Concluído |
| 7 | Tasks no Calendário | Alta | Média | ✅ Concluído |
| 8 | Cache de Notebooks | Alta | Baixa | ✅ Concluído (Framer Motion fix) |
| 9 | Ordenação Tasks com Seções | Alta | Média | ✅ Concluído |
| 10 | BalanceSummary Mês Selecionado | Alta | Baixa | ✅ Concluído |
| 11 | Pagamento Gera Despesa | Alta | Alta | ✅ Concluído |

---

## Notas

- Tasks #2 e #3 são relacionadas e devem ser implementadas juntas
- Task #9, #10, #11 são bugs/melhorias identificados na sessão de 01/01/2026
- Task #11 é crítica para o fluxo de finanças funcionar corretamente
