# Context — Tech Setup

> Glossário ubíquo do projeto. Só termos de domínio, sem detalhes de implementação.

## Termos

### Faceless Niche Site

Blog sem autor visível, focado em um nicho específico, onde todo o conteúdo é
produzido (total ou parcialmente) por IA e revisado por um humano. Monetização
típica: display ads (AdSense, Mediavine, Ezoic). Aqui sinônimo de "Blog
Fantasma".

### Programmatic SEO

Estratégia de gerar páginas em escala a partir de dados/keywords, visando
ocupar long-tail no SERP. No Tech Setup: artigos em EN sobre troubleshooting
tech, Discord bots, Windows setup, etc.

### Organization-as-Author

Decisão editorial: a "autoria" dos artigos é atribuída à Organization "Tech
Setup", não a uma Person. Reflete a natureza faceless do site e satisfaz
E-E-A-T usando `publisher` como entidade única no JSON-LD.

### Reviewer

Papel humano desempenhado pelo operador do site. Pega artigos em `draft`, valida
conteúdo, ajusta hero image, aprova e agenda publicação. É o sinal humano que
alimenta a pontuação de Trust do E-E-A-T.

### On-demand ISR

Revalidação Incremental Static Regeneration disparada por chamada explícita
(via `/api/revalidate`), em vez de polling por tempo. Garante que artigos
recém-publicados apareçam imediatamente no site, sem custo de banco.

### Topical Authority

Conceito de SEO onde o Google avalia a profundidade de cobertura de um tópico.
No Tech Setup: conquistada via tags M:N que cruzam clusters (ex: `discord` ×
`audio` × `troubleshooting`).

### Status do Artigo

Ciclo de vida editorial: `draft` → `in_review` → `scheduled` → `published`.
Apenas `published` é visível publicamente.

### Tier-1 (audiência)

Visitantes de países com RPM AdSense alto (US, UK, UE, CA, AU). É o público-alvo
do Tech Setup — daí conteúdo em inglês.

### AdSense Placeholder

Bloco server-rendered com `min-height` reservado, no lugar onde o AdSense
entrará após aprovação. Evita CLS quando o anúncio carrega e não causa
hydration mismatch (vazio no momento da hidratação).

### Dedupe

Processo de identificar e neutralizar artigos duplicados ou demasiadamente
similares. Critérios: Levenshtein ≤1 (robusto a stemmer) + similaridade
Díce-Sørensen ≥0.6 + guard de token-único. Não-canônicos vão para `draft`
(reversível), nunca são deletados.

### Cadência Editorial

Decisão pós-rejeição AdSense: no máximo **1 artigo publicado por dia**, com
horário aleatório entre 06:00 e 22:59 UTC. Sinal de frescor real e curadoria,
em vez de volume de fábrica.

### Categoria saudável vs. Tag saudável

Taxonomia pós-poda: categorias são canônicas (10); tags só aparecem no site
(URLs, sitemap) se tiverem ≥3 artigos publicados. Tags fracas são podadas —
evita páginas finas que reforçam o sinal de "conteúdo de baixo valor".

### Editorial Policy

Página que divulga honestamente como o conteúdo é produzido: IA assistida,
revisão humana, política de correções, publicidade e originalidade. É a
âncora de transparência do E-E-A-T do site faceless.

### Conteúdo de Baixo Valor (Google)

Motivo da rejeição do AdSense (2026-08-03). Sinal de site "de fábrica": pouco
conteúdo original, duplicação, cadência artificial, taxonomia poluída. O plano
de remediação (fases 1–4) ataca exatamente esses sinais.