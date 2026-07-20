# Tech Setup — Plano Arquitetural

> Faceless Niche Site (Programmatic SEO) para audiência Tier-1 (US/EU), monetizado via Google AdSense.

## Decisões Consolidadas (Grill Session — 22 perguntas)

| # | Decisão | Escolha |
|---|--------|---------|
| 1 | Natureza do produto | Faceless Niche Site / Programmatic SEO |
| 2 | Idioma do conteúdo | Inglês (audiência Tier-1 EU/US) |
| 3 | Fonte de tráfego | SEO orgânico puro (long-tail) |
| 4 | Taxonomia | Flat categories + tags M:N |
| 5 | Workflow do artigo | 4 estados: draft → in_review → scheduled → published |
| 6 | Entrada de conteúdo | Script Node.js autônomo (Service Role), revisão no Supabase Studio |
| 7 | ISR | On-demand via `/api/revalidate` chamado pelo script |
| 8 | Imagens | Unsplash automático + revisão/substituição manual |
| 9 | E-E-A-T | Organization as author (não Person) |
| 10 | Cron de publicação | Vercel cron → `/api/cron/publish` (a cada 5 min) |
| 11 | Estrutura de URLs | Prefixo `/blog/` |
| 12 | Layout do artigo | Single column + related no rodapé |
| 13 | Hero image | Obrigatório, `next/image` com `priority` |
| 14 | Sitemap | Dinâmico via `app/sitemap.ts` com ISR cache |
| 15 | Syntax highlighting | Shiki via `rehype-pretty-code` (server-side, zero JS client) |
| 16 | Busca interna | Sem busca no MVP |
| 17 | Analytics | Vercel Analytics |
| 18 | RLS | `anon` SELECT só em `status='published'` |
| 19 | AdSense | Placeholders server-rendered desde o MVP, script via `lazyOnload` pós-aprovação |
| 20 | Páginas legais | Privacy + Terms + Cookie + About + Contact + DMCA |
| 21 | Nome da marca | "Tech Setup" |
| 22 | Artigos no MVP | 40 artigos revisados |

## Stack

- **Frontend:** Next.js (App Router) + Tailwind CSS + `@tailwindcss/typography`
- **Markdown:** `react-markdown` + `remark-gfm` + `rehype-pretty-code` (Shiki server-side)
- **Imagens:** `next/image` com `priority` no hero, AVIF/WebP
- **Backend:** Supabase (PostgreSQL + Storage)
- **Hospedagem:** Vercel (CDN + Cron + Analytics)
- **DNS/Analytics:** Vercel Analytics no MVP, Plausible cloud quando escalar

## Schema PostgreSQL

```
categories (id, name, slug)
tags (id, name, slug)
articles (
  id, category_id, title, slug, content,
  hero_image_url, status, published_at,
  created_at, updated_at
)
article_tags (article_id, tag_id)
```

### ENUM `article_status`

- `draft` — IA gerou, aguarda revisão
- `in_review` — reviewer humano pegou
- `scheduled` — aprovado, `published_at` no futuro
- `published` — público no blog

### RLS

- `anon`: SELECT apenas em `articles` com `status='published'`
- `categories`, `tags`: SELECT público
- Escrita: apenas via `service_role` (script Node.js)

## URLs

| Rota | Descrição |
|------|-----------|
| `/` | Home — artigos recentes |
| `/blog/[slug]` | Artigo individual |
| `/blog/category/[slug]` | Lista por categoria |
| `/blog/tag/[slug]` | Lista por tag |
| `/about` | Sobre + editorial policy (E-E-A-T) |
| `/contact` | Contato + reportar erros |
| `/privacy-policy` | Privacidade |
| `/terms` | Termos de uso |
| `/cookie-policy` | Política de cookies |
| `/dmca` | DMCA (obrigatório AdSense Tier-1) |
| `/sitemap.xml` | Dinâmico (`app/sitemap.ts`) |
| `/robots.txt` | Bloqueia `/api/*` |
| `/api/revalidate` | On-demand ISR (secret token) |
| `/api/cron/publish` | Vercel cron a cada 5 min |

## Workflow de Publicação

1. Script Node.js gera texto via IA (em EN)
2. Script busca hero no Unsplash API, sobe no Supabase Storage
3. Script insere no Supabase com `status='draft'` via `service_role`
4. Reviewer revisa no Supabase Studio, ajusta hero se necessário
5. Reviewer troca para `status='scheduled'` com `published_at` futuro
6. Vercel cron `/api/cron/publish` roda a cada 5 min
7. Cron move `scheduled`→`published` quando `published_at <= now()`
8. Cron chama `/api/revalidate?slug=...`
9. Next.js regenera a página via ISR (artigo, home, categoria, tag)

## Layout

- Single column, max-width ~720px
- Hero no topo (next/image priority)
- H1 + meta (datePublished, Organization)
- In-content entre H2: placeholder AdSense com `min-height` reservada
- Corpo (Markdown → Shiki)
- Related articles no rodapé
- Footer AdSense placeholder
- Sidebar: **nenhuma** (piora CLS em mobile)

## AdSense

- Placeholders server-rendered: `<div data-ad-slot="..." style="min-height: 250px" />`
- Script AdSense via `next/script` `strategy="lazyOnload"` (só após aprovação)
- Slots: in-content (entre H2) + footer. Nenhum above-the-fold (piora LCP)
- Ad-blockers: placeholders vazios não causam hydration mismatch

## MVP Scope

- 40 artigos revisados em EN
- Nichos: troubleshooting tech, Discord bots, Windows setup, software config
- Lighthouse Mobile 90+
- Dominío real registrado antes do deploy

## Pendências (a resolver na execução)

- [ ] Registro do domínio (`.com` ou `.io`?)
- [ ] Secret token compartilhado entre script e `/api/revalidate`
- [ ] Lista canônica de 5-8 categorias + universo de tags
- [ ] Chave API do Unsplash
- [ ] Projeto Supabase + tabelas + RLS + Storage bucket
- [ ] Conta Vercel + projeto + cron job configurado
- [ ] Conta Google Search Console + AdSense