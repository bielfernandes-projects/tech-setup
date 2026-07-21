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
| CDN/Analytics | Vercel (Auto-deploy + @vercel/analytics) | ✅ Ativo |
| Repositório | https://github.com/bielfernandes-projects/tech-setup | ✅ Ativo |
| Domínio | https://tech-setup.vercel.app | ✅ Ativo |

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
- Artigo: reading progress bar (1px top) + breadcrumbs (aria-current) + author byline (avatar + "Reviewed {date}") + reading time + last updated badge + content + tags + related articles (com miniatura) + lateral TOC (desktop)
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
│   ├── AuthorByline.tsx       # Avatar + nome + "Reviewed {date}"
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
├── generate-article.ts
├── gem-instruction.md
├── schedule-articles.ts
└── topics.json
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
| `AuthorByline` | Server | Avatar "TS" + nome + "Reviewed {date}" |
| `ReadingProgress` | Client | Barra 1px no topo — scroll progress com IntersectionObserver |
| `TableOfContents` | Client | TOC lateral (xl+) — IntersectionObserver + heading highlighting |

### Repository Pattern

- `src/lib/articles/repository.ts` define a interface `ArticleRepository` — a única superfície que as páginas conhecem.
- `src/lib/articles/supabase-adapter.ts` implementa a interface com queries Supabase + normalização.
- Todas as páginas usam `articleRepository` exportado de `src/lib/articles`. O schema do banco fica isolado no adapter.
- Métodos: `findPublished`, `findBySlug`, `findByCategory`, `findByTag`, `findRelated`, `listPublishedSlugs`, `listCategories` (com counts), `listCategorySlugs`, `listTagSlugs`, `findCategoryBySlug`, `findTagBySlug`.
- Antigo `src/lib/mdx.ts` removido (era uma coleção de 12 funções thin wrappers).

### Site Constants

- `src/lib/site.ts` centraliza nome, descrição, URL e helpers (`siteUrl`).
- Fallback de URL: `process.env.NEXT_PUBLIC_SITE_URL ?? "https://tech-setup.vercel.app"`.
- Todas as páginas (home, artigos, categorias, tags, about, contact, legal pages) usam `site.name` e `siteUrl()`.

## Scripts

### Geração de Artigos

- **Local:** `scripts/generate-article.ts`
- **Dependências:** `@google/generative-ai`, `tsx`, `dotenv`
- **Modelo:** `gemini-flash-lite-latest` (free tier)
- **Uso single:** `npx tsx scripts/generate-article.ts "topic" --category X --tags a,b`
- **Uso batch:** `npx tsx scripts/generate-article.ts --batch [--limit N]`
- **Uso refill:** `npx tsx scripts/generate-article.ts --refill N` (gera novos tópicos no topics.json)
- **Uso batch+refill:** `npx tsx scripts/generate-article.ts --batch --limit 10 --refill 5`
- **Fluxo:** Gemini gera Markdown (2 chamadas: meta + content) → Unsplash busca hero → Supabase Storage → DB como draft
- **Auto-consumo:** Tópicos são removidos do topics.json após uso bem-sucedido
- **Auto-refill:** `--refill N` gera novos tópicos via Gemini ao final do batch
- **Quota:** Gemini free tier por modelo, varia entre 20-1500 req/dia
- **GEM instruction:** `scripts/gem-instruction.md` — instrução para o GEM gerar SQL de artigos. Fluxo em 2 passos: (1) SQL com estrutura (content=NULL), (2) conteúdo Markdown + UPDATE. Anti-patterns: sem CREATE TABLE, sem URLs no conteúdo, sem truncamento

### Agendamento de Artigos

- **Local:** `scripts/schedule-articles.ts`
- **Uso:** `npx tsx scripts/schedule-articles.ts`
- **Dry run:** `npx tsx scripts/schedule-articles.ts --dry-run`
- **Count:** `npx tsx scripts/schedule-articles.ts --count 5`
- **Fluxo:** Seleciona drafts com hero image → agenda até 3/dia → preenche dias com <3 antes de partir pro próximo
- **Regras:** Só agenda artigos com `hero_image_url`, ordena por `created_at` ASC (mais antigos primeiro)

## Variáveis de Entorno

| Variável | Onde usar | Descrição |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Anon key pública (somente SELECT em artigos publicados) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | Service role (scripts + cron) — **nunca expor no browser** |
| `REVALIDATE_SECRET` | Vercel + local | Header secret para `/api/revalidate` |
| `CRON_SECRET` | Vercel | Header `Authorization: Bearer <token>` enviado pelo Vercel Cron para `/api/cron/publish` |
| `NEXT_PUBLIC_SITE_URL` | Vercel (opcional) | URL canônica do site; fallback é `https://tech-setup.vercel.app` |
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
- **Código de verificação:** `7HsyJ-d3CkcuUwYeFbw2I24Dnz7hdC_JavINiLc3eg0`
- **Sitemap:** https://tech-setup.vercel.app/sitemap.xml (submetido)
- **Propriedade:** Prefixo de URL (https://tech-setup.vercel.app)

### SEO Implementado

- **Canonical tags:** Todas as páginas têm `alternates.canonical` (artigos, categories, tags, about, contact, legal pages)
- **JSON-LD structured data:** Article + BreadcrumbList em cada artigo, WebSite + Organization + ItemList na home, CollectionPage em categories/tags, AboutPage em /about
- **Open Graph:** Dinâmico por artigo (hero image + título + excerpt), Twitter card large image
- **Sitemap completo:** Home + artigos + categories + tags + páginas estáticas (about, contact, privacy, terms, cookies, dmca)
- **Home page ISR:** `revalidate: 60` (substituiu force-dynamic)
- **Breadcrumb navigation:** Visível em artigos, categories, tags
- **Author byline:** "Tech Setup" como organização em todos os artigos — avatar "TS" + "Reviewed {date}"
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
- **E-E-A-T:** About page expandida com quem somos, o que cobrimos, política editorial

### Google AdSense

- **Status:** Aguardando pré-requisitos
- **Requisitos:** ~30 artigos publicados + indexação + tráfego orgânico
- **Placeholders:** Removidos do layout do artigo — AdSense insere os próprios quando aprovado
- **Script:** A adicionar após aprovação (via `next/script` `lazyOnload`)

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
- [ ] Popular dados reais (40 artigos) — 19 criados (9 published, 10 scheduled), quota Gemini free = 10/dia
- [x] Configurar cron na Vercel (/api/cron/publish) — 1x/dia (Hobby plan)
- [x] Configurar Vercel Analytics
- [x] Front-end: design system, layout, category/tag pages, hero images
- [x] Google Search Console — verificado, sitemap submetido
- [ ] Comprar dominio personalizado
- [ ] Configurar CloudFlare ou DNS
- [ ] Aplicar para Google AdSense (quando ~30 artigos + tráfego)
- [x] Fix BOM issue em env vars do Vercel
- [x] Home page: force-dynamic (resolveu fetch vazio no build)
- [x] Imagens externas: domínios autorizados no next.config.ts
- [x] Criar instrucoes.md com guia completo de uso
