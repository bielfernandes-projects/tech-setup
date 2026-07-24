# Instruções — Tech Setup

Guia rápido pra consultar quando precisar.

---

## 1. Imagem do Hero (artigo)

### Opção A: Usar Unsplash (automático via script)

O script `generate-article.ts` já busca e baixa imagens do Unsplash automaticamente. Não precisa fazer nada.

### Opção B: Upload manual (imagem própria)

1. **Baixe a imagem** no seu PC (formato `.webp` ou `.avif` recomendado)
2. Acesse o **Supabase Studio**: https://supabase.com/dashboard/project/mrkumsgzvsjtlbptrqgl
3. Vá em **Storage → `hero-images` → pasta `heroes/`**
4. Clique **Upload File** → selecione o arquivo
5. **Nome do arquivo deve ser o slug do artigo** (ex: `como-configurar-docker.webp`)
6. Depois de subir, clique no arquivo → **Get Public URL**
7. Copie a URL (algo como `https://mrkumsgzvsjtlbptrqgl.supabase.co/storage/v1/object/public/hero-images/heroes/como-configurar-docker.webp`)
8. No **Supabase Studio → Table Editor → `articles`** → edite o campo `hero_image_url` do artigo

### Opção C: URL externa (Google, etc.)

Funciona com domínios autorizados no `next.config.ts`:
- `mrkumsgzvsjtlbptrqgl.supabase.co` (Supabase Storage)
- `images.unsplash.com`
- `lh3.googleusercontent.com` (Google)
- `pbs.twimg.com` (Twitter/X)
- `i.imgur.com` (Imgur)
- `upload.wikimedia.org` (Wikipedia)
- `avatars.githubusercontent.com` / `raw.githubusercontent.com` (GitHub)

**Pra adicionar outro domínio:** edite `next.config.ts` → `images.remotePatterns` e adicione uma entrada nova.

---

## 2. Gerar artigos novos

### Geração única

```bash
npx tsx scripts/generate-article.ts "título do artigo" --category "Categoria" --tags tag1,tag2
```

### Geração em batch (lista de tópicos)

```bash
npx tsx scripts/generate-article.ts --batch --limit 10
```

Tópicos ficam em `scripts/topics.json` e são **auto-consumidos** (removidos após uso).

### Refill de tópicos

```bash
# Gerar 5 novos tópicos no topics.json
npx tsx scripts/generate-article.ts --refill 5

# Batch + refill (consome e repõe automaticamente)
npx tsx scripts/generate-article.ts --batch --limit 10 --refill 5
```

O prompt de refill é editável na constante `REFILL_PROMPT` no topo do script.

### GEM (Gemini)

O arquivo `scripts/gem-instruction.md` contém instruções pra criar um GEM que gera SQL pronto pro banco. Use quando a quota do Gemini API esgotar.

---

## 3. Agendar artigos pra publicação

O script `schedule-articles.ts` seleciona artigos prontos (draft/in_review com hero image) e agenda até **3 por dia**, preenchendo dias antes de partir pro próximo.

### Fluxo normal

```bash
npx tsx scripts/schedule-articles.ts
```

Seleciona até 3 artigos com hero image, agenda todos no próximo dia com vaga.

### Simular sem alterar nada

```bash
npx tsx scripts/schedule-articles.ts --dry-run
```

### Agendar mais de 3

```bash
npx tsx scripts/schedule-articles.ts --count 5
```

### Regras de agendamento

| Dia atual | Artigos agendados | Vagas | O que acontece |
|---|---|---|---|
| Jul 22 | 2 | 1 | +1 pra completar 3 |
| Jul 23 | 0 | 3 | +3 preenche tudo |
| Jul 24 | 3 | 0 | Pula pro Jul 25 |

- Só agenda artigos com `hero_image_url` preenchido
- Artigos sem imagem ficam como `draft` — dá tempo de adicionar manualmente
- Ordena por `created_at` (mais antigos primeiro)
- Preenche dias com <3 antes de ir pro próximo

### Rotina diária típica

```bash
# 1. Gerar artigos (Gemini quota reseta à meia-noite UTC)
npx tsx scripts/generate-article.ts --batch

# 2. Revisar no Supabase Studio se quer ajustar títulos/excertos

# 3. Agendar 3 pra publicação
npx tsx scripts/schedule-articles.ts

# 4. O cron publica automaticamente à meia-noite UTC (21:00 BRT)
```

---

## 4. Publicar um artigo manualmente

1. Acesse **Supabase Studio → Table Editor → `articles`**
2. Encontre o artigo
3. Mude `status` de `draft` para `scheduled`
4. Em `published_at`, coloque a data no formato **UTC midnight** do dia que quer publicar
   - Ex: quer publicar no dia 25 de julho → `2026-07-25T00:00:00Z`
   - O cron roda à meia-noite UTC, vai publicar automaticamente
5. O cron do Vercel (`api/cron/publish`) roda **1x por dia à 00:00 UTC** (21:00 BRT)

### Publicar imediatmente

Chame o endpoint manualmente:

```bash
curl https://techsetup.site/api/cron/publish
```

---

## 5. Deploy manual

```bash
vercel --prod --yes
```

Ou faça push pro GitHub — o Vercel faz deploy automático.

---

## 6. Revalidar cache manualmente

Quando fizer alterações diretas no banco (editar título, trocar hero image, etc), revalide:

```bash
curl -X POST https://techsetup.site/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: <REVALIDATE_SECRET>" \
  -d '{}'
```

Isso invalida a home page e o sitemap. Pra revalidar um artigo específico:

```bash
curl -X POST https://techsetup.site/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: <REVALIDATE_SECRET>" \
  -d '{"slug":"como-configurar-docker"}'
```

---

## 7. Verificar status do banco

### Via Supabase Studio
https://supabase.com/dashboard/project/mrkumsgzvsjtlbptrqgl

### Via terminal
```bash
# Listar artigos
curl -s "https://mrkumsgzvsjtlbptrqgl.supabase.co/rest/v1/articles?select=status,title,published_at&order=created_at.desc" \
  -H "apikey: SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY"
```

---

## 8. Variáveis de ambiente

Todas em `.env.local` e no Vercel:

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública (mesma de cima) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (uso admin, não expor) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (client-side) |
| `GEMINI_API_KEY` | Chave da API do Google Gemini |
| `UNSPLASH_ACCESS_KEY` | Chave de acesso do Unsplash |
| `REVALIDATE_SECRET` | Segredo pra invalidar cache do Next.js |

---

## 9. URLs importantes

| Serviço | URL |
|---|---|
| Site | https://techsetup.site |
| Supabase Studio | https://supabase.com/dashboard/project/mrkumsgzvsjtlbptrqgl |
| Vercel Dashboard | https://vercel.com/bielfernandes-projects-projects/tech-setup |
| GitHub Repo | https://github.com/bielfernandes-projects/tech-setup |
| Google Search Console | https://search.google.com/search-console |
| Google AdSense | https://adsense.google.com |

---

## 10. Google Search Console (GSC)

### Configuração

1. Acesse https://search.google.com/search-console
2. Adicione propriedade → **Prefixo de URL** → `https://techsetup.site`
3. Verificação via **HTML tag** (tag já está no `layout.tsx`)
4. Após verificação, submeta o sitemap: **Sitemaps → adicione `sitemap.xml`**

### Verificar indexação

- Vá em **Inspeção de URL** → cole `https://techsetup.site`
- Clique **Solicitar indexação**
- Aguarde 1-2 dias pra Google indexar os artigos

### Notas

- A verificação já está configurada no código (meta tag no `layout.tsx`)
- Se mudar de domínio, atualizar a meta tag com novo código de verificação
- Limite diário de inspeções de URL (~10-20/dia)

---

## 11. Google AdSense

### Pré-requisitos

| Requisito | Status |
|---|---|
| 20-30+ artigos publicados | ⬜ |
| Páginas legais (Privacy, Terms, Cookies, DMCA) | ✅ |
| About com editorial policy | ✅ |
| Contact funcional | ✅ |
| Site indexado no Google | ⬜ Faz após GSC |
| Tráfego orgânico real | ⬜ Precisa de mais conteúdo |

### Quando aplicar

Esperar até ter ~30 artigos publicados + indexação do Google + algum tráfego orgânico. Cada rejeição fica no histórico.

### Fluxo (quando pronto)

1. Acesse https://adsense.google.com → cadastre o domínio
2. AdSense gera um script (`<script async src="...">`)
3. Adicionar o script no código via `next/script` `strategy="lazyOnload"`
4. Criar arquivo `public/ads.txt` com o conteúdo do AdSense
5. Aguardar revisão (2-4 semanas)
