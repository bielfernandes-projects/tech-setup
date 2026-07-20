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