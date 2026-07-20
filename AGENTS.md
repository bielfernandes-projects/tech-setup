# Regras para Agentes de IA

Este arquivo define as regras de governança que todo agente deve seguir ao trabalhar neste repositório.

## Pré-requisitos de CLI

Antes de qualquer operação, verificar:

- [ ] **Supabase CLI** (`supabase --version`) — instalado globalmente
- [ ] **GitHub CLI** (`gh --version`) — instalado globalmente, autenticado
- [ ] **Vercel CLI** (`vercel --version`) — instalado globalmente, autenticado

Se qualquer CLI estiver faltando, instalar/configurar antes de prosseguir.

## Contextualização Obrigatória

Antes de **qualquer tarefa** (codar, migrar, configurar), o agente DEVE ler e se contextualizar através destes arquivos, nesta ordem:

1. **`CONTEXT.md`** — glossário ubíquo do domínio (termos, decisões fonéticas)
2. **`PLAN.md`** — plano arquitetural consolidado do projeto
3. **`documentation.md`** — documentação viva do projeto (reflete o estado atual)

Saltar a leitura desses arquivos pode resultar em decisões inconsistentes com o plano.

## Commit e Push

- **Nunca** commitar ou dar push sem autorização explícita do usuário
- O usuário testa localmente antes de autorizar o commit
- Exceção: `documentation.md` pode ser atualizado a qualquer momento sem depender de autorização

## Atualização da Documentação

- Após **qualquer mudança significativa** (código, schema, configuração), atualizar `documentation.md` antes de commitar
- `documentation.md` é a fonte da verdade para o estado atual do projeto
- Manter o formato consistente: seção por área (Stack, Schema, Rotas, etc.)

## Stack do Projeto

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Storage)
- **Hospedagem:** Vercel (CDN + Cron + Analytics)
- **Markdown:** `react-markdown` + `rehype-pretty-code` (Shiki server-side)
- **Imagens:** `next/image` + Supabase Storage
