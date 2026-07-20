# ADR 0002 — On-demand ISR over Time-based Polling

**Data:** 2026-07-20
**Status:** Aceito

## Contexto

O blog usa Next.js (App Router) com Supabase como fonte de dados. Visitar o
Supabase a cadarequest é caro e lento. Precisávamos escolher a estratégia de
cache das páginas estáticas.

Publicação acontece via cron que move `scheduled` → `published` na data
marcada. Precisávamos garantir que um artigo recém-publicado aparecesse no
site sem latência imprevisível.

## Decisão

**On-demand ISR** via rota `/api/revalidate` protegida por secret token. O cron
de publicação chama essa rota com o `slug` recém-publicado, e o Next.js
regenera apenas as páginas afetadas (artigo + home + categoria + tag).

## Alternativas Consideradas

1. **ISR por tempo (`revalidate: N seconds`).** Next.js revalida a cada N
   segundos automaticamente. Rejeitado: latência de até N segundos entre
   publicação e aparição no site, sem controle determinístico. Race condition
   entre cron (`scheduled`→`published`) e revalidação por tempo——por risco de
   publicar uma página que ainda serve o estado anterior.
2. **SSG puro (rebuild no build).** Rejeitado: exigiria disparar build
   manualmente a cada publicação, quebrando o fluxo "IA age via banco, cron
   publica". Sem ISR, não há cache incremental entre builds.
3. **On-demand ISR (escolhida).** Publicação determinística: assim que o cron
   move o status, ele mesmo chama `/api/revalidate`, e a página é regenerada.
   Latência zero para o usuário final, custo mínimo no Supabase.

## Consequências

- Necessária uma rota API `/api/revalidate?slug=...` protegida por secret
  compartilhado entre o cron e o Next.js.
- O script Node.js (futuro) também poderá chamar essa rota para revalidar após
  edições em artigos já `published`.
- Sitemap dinâmico (`app/sitemap.ts`) herda o mesmo ISR com cache de 1h —
  sitemap permanece fresco entre publicações sem rebuild.
- Trade-off aceito: se o cron falhar (Vercel fora do ar), publicação manual
  ainda é possível chamando `/api/revalidate` direto.