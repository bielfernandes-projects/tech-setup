# Documentação — Tech Setup

> Documentação viva do projeto. Mantida por agentes de IA.
> Atualizar a cada mudança significativa.

---

## Stack

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Frontend | Next.js 16 (App Router) | ✅ Ativo |
| Estilização | Tailwind CSS 4 + @tailwindcss/typography + Lucide React | ✅ Ativo |
| Design System | OKLCH palette (azul marinho #0A0C21 + roxo #7A00B3 + amber accent, 100% dark) | ✅ Ativo |
| Markdown | react-markdown + remark-gfm + rehype-sanitize + rehype-slug | ✅ Ativo |
| Banco | Supabase PostgreSQL (us-east-1) | ✅ Ativo |
| Storage | Supabase Storage (hero-images) | ✅ Ativo |
| CDN/Analytics | Vercel (Auto-deploy + @vercel/analytics + @vercel/speed-insights) | ✅ Ativo |
| Repositório | https://github.com/bielfernandes-projects/tech-setup | ✅ Ativo |
| Domínio | https://techsetup.site | ✅ Ativo |

## Projeto Supabase

- **Nome:** tech-setup
- **Ref:** mrkumsgzvsjtlbptrqgl
- **Região:** East US (North Virginia) — us-east-1
- **URL:** https://mrkumsgzvsjtlbptrqgl.supabase.co
- **Status:** Ativo

### Projetos relacionados (org okiiyspgzjxrjxfoiktc)

- Lema Discovery (puqirnuxmrrvwtkqrneh) — PAUSED
- Lobinho-Game (bamygdefokpdrzdofccu) — ACTIVE
- Tech Setup (mrkumsgzvsjtlbptrqgl) — ACTIVE

## Schema PostgreSQL (migração 20260720211943_init)

### Tabelas
- `categories` (id, name, slug)
- `tags` (id, name, slug)
- `articles` (id, category_id, title, slug, content, excerpt, hero_image_url, status, published_at, created_at, updated_at)
- `article_tags` (article_id, tag_id) — M:N

### ENUM `article_status`
- `draft`, `in_review`, `scheduled`, `published`

### RLS
- Anon: SELECT only on `articles` with `status='published'`
- Categories and tags: fully public for SELECT
- Writes: service_role only

## Supabase Storage

- **Bucket:** `hero-images` (público)
- **Path:** `heroes/{slug}.avif`
- **Políticas:** public read, service_role write/delete

## Rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/` | ISR (60s) | Home — lista artigos recentes com hero images + WebSite/ItemList JSON-LD |
| `/blog/[slug]` | SSG (ISR) | Página do artigo + related articles + tags + Article/BreadcrumbList JSON-LD + breadcrumbs |
| `/blog/category/[slug]` | SSG (ISR) | Lista artigos por categoria + CollectionPage JSON-LD + breadcrumbs |
| `/blog/tag/[slug]` | SSG (ISR) | Lista artigos por tag + CollectionPage JSON-LD + breadcrumbs |
| `/about` | Static | About + E-E-A-T + AboutPage JSON-LD + canonical |
| `/editorial-policy` | Static | Política editorial honesta (IA assistida, revisão, correções) + canonical |
| `/contact` | Static | Contato + canonical |
| `/privacy-policy` | Static | Privacidade + canonical |
| `/terms` | Static | Termos de uso + canonical |
| `/cookie-policy` | Static | Política de cookies + canonical |
| `/dmca` | Static | DMCA notice + canonical |
| `/sitemap.xml` | Dynamic | Generated from DB (articles + categories + tags + static pages) |
| `/robots.txt` | Static | Generated from code (hardcoded domain) |
| `/api/revalidate` | POST | On-demand ISR (secret protected) |
| `/api/cron/publish` | GET | Vercel cron — publica artigos agendados. Requer `CRON_SECRET` no header `Authorization` |
| not-found | Static | 404 page |

## Layout

- Header: site name + nav (Home, About, Contact) — 56px fixed
- Footer: 4-column grid (Site / Categories / Legal / Tagline) — "Built for developers who debug for a living"
- Single column, max-width 48rem (3xl), except artigo page (6xl com sidebar TOC)
- Home: hero com H1 + subheadline + métricas ("X guides published · Y topics covered") + category chips + featured article + category grid + latest articles list. **Featured** é sempre o artigo mais recente (por `published_at desc`). Não há flag `is_featured` no banco — é dinâmico. Artigos novos viram featured por ~24h. Para controle editorial manual, considerar coluna `is_featured` + método `findFeatured()` no repository.
- Artigo: reading progress bar (1px top) + breadcrumbs (aria-current) + author byline (avatar + "Published {date}" + link Editorial Policy) + reading time + last updated badge + content + tags + related articles (com miniatura) + lateral TOC (desktop)
- Hero image (next/image, priority, 16:9 ratio)
- Empty state: centered message
- 404: minimal with back-to-home CTA

## Design System

- **Paleta:** OKLCH — azul marinho escuro (#0A0C21) + cinza surface (#111114), 100% dark, sem light mode
- **Tipografia:** Geist Sans (corpo) + Geist Mono (código)
- **Cores:** bg=#000715 (azul marinho), surface=#111114 (cinza), ink=zinc-300, primary=oklch(0.55 0.22 308) (roxo claro), primary-hover=oklch(0.62 0.21 308), accent=#018EDB (azul claro), muted=oklch(0.62 0.012 286), border=#1E1E28
- **WCAG 2.1 AA** — contraste ≥4.5:1 corpo, `:focus-visible` ring em todos os links/botões
- **`prefers-reduced-motion`** respeitado
- **`color-scheme: dark`** definido no `<html>`
- Veja `DESIGN.md` e `PRODUCT.md` pra detalhes completos

## Estrutura de Diretórios

```
src/
├── app/
│   ├── api/
│   │   ├── cron/publish/route.ts
│   │   └── revalidate/route.ts
│   ├── blog/
│   │   ├── [slug]/page.tsx
│   │   ├── category/[slug]/page.tsx
│   │   └── tag/[slug]/page.tsx
│   ├── about/page.tsx
│   ├── editorial-policy/page.tsx
│   ├── contact/page.tsx
│   ├── cookie-policy/page.tsx
│   ├── dmca/page.tsx
│   ├── privacy-policy/page.tsx
│   ├── terms/page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── opengraph-image.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── ArticleCard.tsx        # Card reutilizável pra listas de artigos
│   ├── AuthorByline.tsx       # Avatar + nome + "Published {date}" + link Editorial Policy
│   ├── CategoryChips.tsx      # Pills horizontais de categorias
│   ├── CategoryGrid.tsx       # Grid 2x4 de categorias com emoji + descrição
│   ├── FeaturedArticle.tsx    # Card grande pra artigo em destaque na home
│   ├── ReadingProgress.tsx    # Barra de progresso 1px no topo (client)
│   └── TableOfContents.tsx    # TOC lateral com IntersectionObserver (client)
├── lib/
│   ├── articles/
│   │   ├── repository.ts       # ArticleRepository interface (inclui listCategories)
│   │   ├── supabase-adapter.ts # Supabase implementation
│   │   └── index.ts            # exports
│   ├── article-data.ts         # Metadados de categorias (emoji + descrição)
│   ├── markdown-content.tsx    # ReactMarkdown + rehype-sanitize + rehype-slug
│   ├── reading-time.ts         # Calcula tempo de leitura (200 wpm)
│   ├── site.ts                 # single source of truth: name, url, helpers
│   ├── supabase.ts
│   └── types.ts
supabase/
├── migrations/
│   ├── 20260720211943_init.sql
│   └── 20260720214200_hero_images_bucket.sql
scripts/
├── generate-article.ts      # Geração via Gemini + Unsplash
├── create-15-articles.ts    # Inserção manual (sem IA)
├── check-db.ts              # Verificação do estado do banco
├── clean-topics.ts          # Limpeza de topics.json
├── schedule-articles.ts     # Agendamento automático (1/dia, horário aleatório)
├── dedupe-articles.ts       # Dedupe: Levenshtein ≤1 + Díce-Sørensen ≥0.6
├── consolidate-categories.ts# Merge de categorias duplicadas
├── split-software-config.ts # Split da categoria "Software Config" removida
├── prune-tags.ts            # Poda de tags com <3 artigos publicados
├── reschedule-scheduled.ts  # Reagenda 1/dia preservando ordem
├── gem-instruction.md       # Instrução GEM
└── topics.json              # Pool de tópicos para geração
```

## Arquitetura

### Componentes UI

Todos em `src/components/`:

| Componente | Tipo | Descrição |
|-----------|------|-----------|
| `ArticleCard` | Server | Card reutilizável — hero image + data + categoria + título + excerpt |
| `FeaturedArticle` | Server | Card grande — hero image com gradient, "Featured" badge, reading time, CTA |
| `CategoryChips` | Server | Pills horizontais — Lucide icon + nome + contagem |
| `CategoryGrid` | Server | Grid 2x4 — Lucide icon com bg-primary/15 + nome + descrição + contagem |
| `AuthorByline` | Server | Avatar "TS" + "Tech Setup" + "Published {date}" + link Editorial Policy |
| `ReadingProgress` | Client | Barra 1px no topo — scroll progress com IntersectionObserver |
| `TableOfContents` | Client | TOC lateral (xl+) — IntersectionObserver + heading highlighting |

### Repository Pattern

- `src/lib/articles/repository.ts` define a interface `ArticleRepository` — a única superfície que as páginas conhecem.
- `src/lib/articles/supabase-adapter.ts` implementa a interface com queries Supabase + normalização.
- Todas as páginas usam `articleRepository` exportado de `src/lib/articles`. O schema do banco fica isolado no adapter.
- Métodos: `findPublished`, `findBySlug`, `findByCategory`, `findByTag`, `findRelated`, `listPublishedSlugs`, `listCategories` (com counts), `listCategorySlugs`, `listTagSlugs(minPublished=3)` (filtra tags com ≥3 publicados via `articles!inner`), `findCategoryBySlug`, `findTagBySlug`.
- Antigo `src/lib/mdx.ts` removido (era uma coleção de 12 funções thin wrappers).

### Site Constants

- `src/lib/site.ts` centraliza nome, descrição, URL e helpers (`siteUrl`).
- Fallback de URL: `process.env.NEXT_PUBLIC_SITE_URL ?? "https://techsetup.site"`.
- Todas as páginas (home, artigos, categorias, tags, about, contact, legal pages) usam `site.name` e `siteUrl()`.

## Scripts

### Geração de Artigos (Gemini)

- **Local:** `scripts/generate-article.ts`
- **Dependências:** `@google/generative-ai`, `tsx`, `dotenv`
- **Modelo:** `gemini-flash-lite-latest` (free tier)
- **Uso single:** `npx tsx scripts/generate-article.ts "topic" --category X --tags a,b`
- **Uso batch:** `npx tsx scripts/generate-article.ts --batch [--limit N]`
- **Uso refill:** `npx tsx scripts/generate-article.ts --refill N` (gera novos tópicos no topics.json)
- **Uso batch+refill:** `npx tsx scripts/generate-article.ts --batch --limit 10 --refill 5`
- **Fluxo:** Gemini gera Markdown (2 chamadas: meta + content) → Unsplash busca hero → Supabase Storage → DB como draft
- **Hero image obrigatória:** falha no Unsplash (com fallback de queries: tópico → categoria → "developer workspace technology") aborta o artigo — nunca salva draft sem imagem
- **Auto-consumo:** Tópicos são removidos do topics.json após uso bem-sucedido
- **Auto-refill:** `--refill N` gera novos tópicos via Gemini ao final do batch
- **Quota:** Gemini free tier por modelo, varia entre 20-1500 req/dia
- **Nota:** Quota free tier pode ser exaustada rapidamente (~10 artigos/dia)
- **GEM instruction:** `scripts/gem-instruction.md` — instrução para o GEM gerar SQL de artigos

### Geração Manual de Artigos (sem IA)

- **Local:** `scripts/create-15-articles.ts`
- **Uso:** `npx tsx scripts/create-15-articles.ts`
- **Dry run:** `npx tsx scripts/create-15-articles.ts --dry-run`
- **Fluxo:** Insere artigos com conteúdo markdown completo diretamente no Supabase (sem Gemini/Unsplash)
- **Uso:** Quando quota Gemini está exausta — artigos são escritos manualmente no script
- **Agendamento:** 3 artigos/dia, datas configuradas no array `SCHEDULE_DATES`

### Agendamento de Artigos

- **Local:** `scripts/schedule-articles.ts`
- **Uso:** `npx tsx scripts/schedule-articles.ts`
- **Dry run:** `npx tsx scripts/schedule-articles.ts --dry-run`
- **Count:** `npx tsx scripts/schedule-articles.ts --count 1`
- **Fluxo:** Seleciona drafts com hero image → agenda **1/dia** (`MAX_PER_DAY=1`) com **horário aleatório 06:00–22:59 UTC** → preenche dias com <1 antes de partir pro próximo
- **Regras:** Só agenda artigos com `hero_image_url`, ordena por `created_at` ASC (mais antigos primeiro). Cadência de 1 artigo/dia decidida pelo dono pós-rejeição AdSense (sinal de frescor/editorial).

### Dedupe de Artigos (pós-rejeição AdSense)

- **Local:** `scripts/dedupe-articles.ts`
- **Uso:** `npx tsx scripts/dedupe-articles.ts --apply`
- **Fluxo:** Compara pares de artigos; fuzzyEqual (Levenshtein ≤1, robusto a stemmer) + similaridade Díce-Sørensen (`shared/(a+b-shared) ≥ 0.6`) + guard de token-único (exige token idêntico entre títulos). `--apply` despublica o não-canônico (`status='draft'`, reversível)
- **Resultado:** 23 artigos despublicados (1ª rodada 18 em 12 grupos, 2ª rodada 4 via script, 1 manual — npm/npx Guide 2026)

### Consolidação de Categorias

- **Local:** `scripts/consolidate-categories.ts`
- **Uso:** `npx tsx scripts/consolidate-categories.ts --apply`
- **Fluxo:** Merge de categorias duplicadas: `windows`→`windows-setup`, `iot`→`home-automation`, `vibecoding`→`ai-development`

### Split de Software Config

- **Local:** `scripts/split-software-config.ts`
- **Uso:** `npx tsx scripts/split-software-config.ts --apply`
- **Fluxo:** `software-config` (bucket genérico, 38 artigos) foi deletada e redistribuída: `programming` (14), `ai-development` (11), `automation` (8), `web3` (4), `devops` (1). Restam **10 categorias**.

### Poda de Tags

- **Local:** `scripts/prune-tags.ts`
- **Uso:** `npx tsx scripts/prune-tags.ts --apply`
- **Fluxo:** Deleta tags com <3 artigos publicados; unifica `vibecoding`→`vibe-coding`. **Resultado:** 144 tags deletadas, restam 23. Afeta sitemap (tags fracas saem) e `generateStaticParams` (páginas órfãs não geradas).

### Reschedule de Artigos Agendados

- **Local:** `scripts/reschedule-scheduled.ts`
- **Uso:** `npx tsx scripts/reschedule-scheduled.ts --apply`
- **Fluxo:** Reagenda todos os `scheduled` para 1/dia preservando a ordem original. 22 agendados reajustados (06:00–22:59 UTC).

### Verificação do Banco

- **Local:** `scripts/check-db.ts`
- **Uso:** `npx tsx scripts/check-db.ts`
- **Fluxo:** Mostra contagem de artigos por status, categorias, tags

### Limpeza de Tópicos

- **Local:** `scripts/clean-topics.ts`
- **Uso:** `npx tsx scripts/clean-topics.ts`
- **Fluxo:** Remove tópicos já usados no DB, adiciona novos tópicos diversos

## Variáveis de Entorno

| Variável | Onde usar | Descrição |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Anon key pública (somente SELECT em artigos publicados) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | Service role (scripts + cron) — **nunca expor no browser** |
| `REVALIDATE_SECRET` | Vercel + local | Header secret para `/api/revalidate` |
| `CRON_SECRET` | Vercel | Header `Authorization: Bearer <token>` enviado pelo Vercel Cron para `/api/cron/publish` |
| `NEXT_PUBLIC_SITE_URL` | Vercel (opcional) | URL canônica do site; fallback é `https://techsetup.site` |
| `GEMINI_API_KEY` | local only | Geração de artigos |
| `UNSPLASH_ACCESS_KEY` | local only | Busca de hero images |
| `SUPABASE_URL` | local only | Alias para `NEXT_PUBLIC_SUPABASE_URL` nos scripts |

## Clientes CLI

| CLI | Versão | Status |
|-----|--------|--------|
| Supabase CLI | 2.109.0 | ✅ |
| GitHub CLI | 2.96.0 | ✅ |
| Vercel CLI | 56.3.1 | ✅ |

## SEO & Indexação

### Google Search Console

- **Status:** Verificado (HTML meta tag no layout.tsx)
- **Código de verificação:** `MtjK5W3N8G89DsjhL03MlXgaj5lPxmmem9-KeJptP88`
- **Sitemap:** https://techsetup.site/sitemap.xml (submetido; recrawl solicitado após remediação — 101 URLs: 60 artigos + 10 categorias + 23 tags + estáticas)
- **Propriedade:** Prefixo de URL (https://techsetup.site)
- **Homepage:** Indexada

### SEO Implementado

- **Canonical tags:** Todas as páginas têm `alternates.canonical` (artigos, categories, tags, about, contact, legal pages)
- **JSON-LD structured data:** Article + BreadcrumbList em cada artigo, WebSite + Organization + ItemList na home, CollectionPage em categories/tags, AboutPage em /about
- **Open Graph:** Dinâmico por artigo (hero image + título + excerpt), Twitter card large image
- **Sitemap completo:** Home + artigos + categories + tags + páginas estáticas (about, contact, privacy, terms, cookies, dmca)
- **Home page ISR:** `revalidate: 60` (substituiu force-dynamic)
- **Breadcrumb navigation:** Visível em artigos, categories, tags
- **Author byline:** "Tech Setup" como organização em todos os artigos — avatar "TS" + "Published {date}" + link `/editorial-policy`
- **Reading time:** Calculado (200 wpm) em artigos e featured article
- **Last updated badge:** Mostrado se `updated_at > published_at + 7 dias`
- **Table of Contents:** Lateral (desktop xl+) com IntersectionObserver, heading highlighting
- **Reading progress bar:** 1px fixa no topo durante scroll do artigo
- **Related articles com miniatura:** Thumbnails 80x112px + título + data + categoria
- **Category chips:** Pills horizontais clicáveis na home com emoji + contagem
- **Category grid:** Cards 2x4 na home com emoji + descrição + contagem de artigos
- **Featured article:** Card grande na home com gradient overlay, reading time, CTA
- **Footer expandido:** 4 colunas (Site, Categories, Legal, Tagline)
- **Acessibilidade:** `:focus-visible` ring, `aria-current="page"` em breadcrumbs, contraste aprimorado (muted oklch 0.6)
- **FAQ sections:** Adicionadas às top 3 páginas (WiFi, Discord Mic, Discord Bot) — schema FAQPage para rich results
- **E-E-A-T (pós-rejeição):** /about reescrito como solo project honesto (sem "team of developers", sem "real hardware", sem nomes reais) + /editorial-policy criado com divulgação honesta de IA assistida, revisão, correções, publicidade e originalidade. Links no footer, byline, /about e sitemap. JSON-LD com `inLanguage: "en-US"`.

### Google AdSense

- **Publisher ID:** `ca-pub-4704944043310509`
- **Status:** ❌ **Rejeitado — "Conteúdo de baixo valor"** (notificação 2026-08-03)
- **Verificação:** Meta tag `google-adsense-account` no `layout.tsx` (método alternativo — `<Script>` não funcionou)
- **CSP:** Domínios AdSense autorizados em `next.config.ts` (`pagead2.googlesyndication.com`, `adservice.google.com`, `googleads.g.doubleclick.net`)
- **Placeholders:** Removidos do layout do artigo — AdSense insere os próprios quando aprovado
- **Script:** A adicionar após aprovação (via `next/script` `lazyOnload`)
- **Plano de remediação (concluído):**
  1. ✅ **Dedupe** — remover conteúdo duplicado/similar (23 despublicados)
  2. ✅ **Taxonomia** — consolidar categorias (38→10) e podar tags (167→23)
  3. ✅ **Cadência** — 1 artigo/dia com horário aleatório (frescor real)
  4. ✅ **E-E-A-T honesto** — /about + /editorial-policy sem alucinações de autoridade
  5. ✅ **Deploy** — commit `158dde8` (03/08/2026), produção validada
  6. ✅ **Recrawl GSC** — sitemap re-enviado e páginas-chave reindexadas (dono, 03/08/2026)
  7. ⏳ **Revisão** — nova revisão será solicitada em **04/09/2026** (após ~1 mês de tráfego orgânico; dono roda o script de geração diariamente e agenda 1/dia até lá)

### Imagens Externas (next/image)

Domínios autorizados em `next.config.ts`:
- `mrkumsgzvsjtlbptrqgl.supabase.co` (Supabase Storage)
- `images.unsplash.com` (Unsplash)
- `lh3.googleusercontent.com` (Google)
- `pbs.twimg.com` (Twitter/X)
- `i.imgur.com` (Imgur)
- `upload.wikimedia.org` (Wikipedia)
- `avatars.githubusercontent.com` / `raw.githubusercontent.com` (GitHub)

Pra adicionar domínios: editar `next.config.ts` → `images.remotePatterns`.

## Segurança

### Autenticação de API

- `/api/cron/publish` exige `Authorization: Bearer <CRON_SECRET>` (enviado automaticamente pelo Vercel Cron). Sem o secret, retorna 401.
- `/api/revalidate` exige `x-revalidate-secret` e valida o `slug` contra regex `/^[a-z0-9-]{1,200}$/`.
- Mensagens de erro internas do Supabase nunca são expostas em responses HTTP — logadas server-side.

### CSP & Headers

`next.config.ts` adiciona headers globais:
- `Content-Security-Policy` — default-src 'self', img-src restrito a domínios confiáveis, frame-ancestors 'none'
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/microphone/geolocation desligados)
- `Strict-Transport-Security` (HSTS)

### Sanitização de Conteúdo

- `MarkdownContent` usa `rehype-sanitize` para limpar HTML cru do conteúdo gerado por IA.

### RLS

- Anon: SELECT only em `articles` com `status='published'`.
- Categories/tags: SELECT público.
- Writes: `service_role` only.
- Storage bucket `hero-images`: public read, service_role write/delete.

## Pendências

- [x] Configurar REVALIDATE_SECRET na Vercel
- [x] Configurar CRON_SECRET na Vercel (obrigatório para `/api/cron/publish`)
- [x] Adicionar SUPABASE_SERVICE_ROLE_KEY na Vercel
- [x] Test deployment em producao
- [x] Refatorar repository pattern (`src/lib/articles/`)
- [x] Centralizar site URL/nome em `src/lib/site.ts`
- [x] Adicionar CSP e security headers
- [x] Sanitizar markdown com `rehype-sanitize`
- [x] Criar script Node.js de geracao de artigos (IA -> Supabase)
- [x] Criar script de agendamento automatico (schedule-articles.ts)
- [x] Popular dados reais — 105 artigos (60 published, 22 scheduled, 23 draft após dedupe)
- [x] Configurar cron na Vercel (/api/cron/publish) — 1x/dia (Hobby plan)
- [x] Vercel Analytics
- [x] Front-end: design system, layout, category/tag pages, hero images
- [x] Google Search Console — verificado, sitemap submetido, homepage indexada
- [x] Comprar dominio personalizado (techsetup.site — $1.99/ano primeiro ano)
- [x] Configurar DNS via Vercel
- [x] Aplicar para Google AdSense — ❌ rejeitado "Conteúdo de baixo valor" (2026-08-03)
- [x] Fix BOM issue em env vars do Vercel
- [x] Home page: force-dynamic (resolveu fetch vazio no build)
- [x] Imagens externas: domínios autorizados no next.config.ts
- [x] Criar instrucoes.md com guia completo de uso
- [x] Fase 1.1 Dedupe — 23 artigos despublicados (12 grupos + npm/npx)
- [x] Fase 1.2 Categorias consolidadas — 38 → 10, software-config removida
- [x] Fase 1.3 Poda de tags — 167 → 23 (minPublished=3 no sitemap)
- [x] Fase 1.4 Cadência — 1/dia, horário aleatório 06:00–22:59 UTC, cron não sobrescreve published_at
- [x] Fase 2.1 About reescrito (solo project honesto)
- [x] Fase 2.2 /editorial-policy criado + links no footer/sitemap
- [x] Fase 2.3 Byline "Published" + link editorial policy + inLanguage no JSON-LD
- [x] Fase 3.1 Prompts de geração reforçados + topics.json atualizado (28 tópicos, categorias válidas)
- [x] Deploy das fases 1–4 — commit `158dde8` (03/08/2026), produção validada
- [x] Recrawl GSC — sitemap + páginas-chave (dono, 03/08/2026)
- [ ] Fase 3.2 Rodar geração diária + agendar publicações (dono roda o script todo dia até 04/09/2026)
- [ ] **04/09/2026** — solicitar nova revisão do AdSense (após ~1 mês de tráfego orgânico)
- [ ] Adicionar script AdSense (next/script lazyOnload) apos aprovacao
- [ ] Monitorar tráfego orgânico e indexação no GSC
