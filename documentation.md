# Documentação — Tech Setup

> Documentação viva do projeto. Mantida por agentes de IA.
> Atualizar a cada mudança significativa.

---

## Stack

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Frontend | Next.js 16 (App Router) | ✅ Ativo |
| Estilização | Tailwind CSS 4 + @tailwindcss/typography | ✅ Ativo |
| Markdown | react-markdown + rehype-pretty-code | ✅ Instalado |
| Banco | Supabase PostgreSQL (us-east-1) | ✅ Ativo |
| Storage | Supabase Storage | ✅ Ativo |
| CDN/Analytics | Vercel (Auto-deploy from GitHub) | ✅ Ativo |
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

## Rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/` | Static | Home — lista artigos recentes |
| `/blog/[slug]` | SSG (ISR) | Página do artigo |
| `/about` | Static | About + editorial policy |
| `/contact` | Static | Contato |
| `/privacy-policy` | Static | Privacidade |
| `/terms` | Static | Termos de uso |
| `/cookie-policy` | Static | Política de cookies |
| `/dmca` | Static | DMCA notice |
| `/sitemap.xml` | Dynamic | Generated from DB |
| `/robots.txt` | Static | Generated from code |
| `/api/revalidate` | POST | On-demand ISR (secret protected) |
| `/api/cron/publish` | GET | Vercel cron — published scheduled articles |
| not-found | Static | 404 page |

## Layout

- Single column, max-width 48rem (3xl)
- Hero image (next/image, priority)
- H1 + published date + category link
- Ad placeholders (in-content between H2s + footer, dashed border)
- Content (Markdown rendered as prose-zinc)
- Related section (placeholder)

## Estrutura de Diretórios

```
src/
├── app/
│   ├── api/
│   │   ├── cron/publish/route.ts
│   │   └── revalidate/route.ts
│   ├── blog/[slug]/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── cookie-policy/page.tsx
│   ├── dmca/page.tsx
│   ├── privacy-policy/page.tsx
│   ├── terms/page.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── lib/
│   ├── mdx.ts
│   ├── supabase.ts
│   └── types.ts
supabase/
├── migrations/
│   └── 20260720211943_init.sql
└── config.toml
```

## Variables de Entorno

- `NEXT_PUBLIC_SUPABASE_URL` — set on Vercel (production)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — set on Vercel (production)
- `SUPABASE_SERVICE_ROLE_KEY` — local only
- `REVALIDATE_SECRET` — not on Vercel yet

## Clientes CLI

| CLI | Versão | Status |
|-----|--------|--------|
| Supabase CLI | 2.109.0 | ✅ |
| GitHub CLI | 2.96.0 | ✅ |
| Vercel CLI | 56.3.1 | ✅ |

## Pendências

- [ ] Configurar REVALIDATE_SECRET na Vercel
- [ ] Adicionar SUPABASE_SERVICE_ROLE_KEY na Vercel
- [ ] Test deployment em producao
- [ ] Criar script Node.js de geracao de artigos (IA -> Supabase)
- [ ] Popular dados reais (40 artigos)
- [ ] Configurar cron na Vercel (/api/cron/publish)
- [ ] Configurar Vercel Analytics
- [ ] Comprar dominio personalizado
- [ ] Configurar CloudFlare ou DNS
- [ ] Submeter ao Google Search Console
- [ ] Aplicar para Google AdSense
