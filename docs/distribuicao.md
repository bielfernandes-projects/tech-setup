# Distribuição — plano de backlinks e tráfego

> Contexto (GSC 2026-10-20): 5 indexadas / 142 não indexadas. O gargalo é autoridade do domínio.
> Sem links externos o Google continua tratando o site como "descoberto, não indexado".
> Fonte de tráfego e links: pessoas reais, não mais artigos.

## Regras

- Postar **como você** (conta pessoal). Nunca criar contas falsas nem postar em massa.
- 1 canal por semana no máximo; responder comentários. Spam em subreddit = ban + sinal ruim.
- Sempre `canonical_url` apontando para o artigo no techsetup.site (dev.to / Hashnode aceitam).
- Divulgar que o conteúdo é assistido por IA e revisado, como na /editorial-policy.

## Artigos para empurrar (já otimizados em 2026-10-20)

| Prioridade | Artigo | Por quê |
|-----------|--------|---------|
| 1 | `/blog/how-to-fix-cors-errors-in-nodejs-and-express-step-by-step` | 103 impressões, tema evergreen, resposta curta e copiável |
| 2 | `/blog/opencode-cli-guide-ai-powered-coding-for-developers` | único com clique orgânico; nicho em crescimento |
| 3 | `/blog/openai-codex-cli-getting-started-with-autonomous-coding` | pos 10,7 |
| 4 | `/blog/getting-started-with-lovable-ai-full-stack-apps-2026` | pos 7,5 |
| 5 | `/blog/how-to-fix-discord-audio-echo-2026-technical-guide` | recebia mais impressão antes do dedupe |

## Canais (ordem de retorno esperado)

1. **dev.to** — republicar o artigo 1 com front matter:
   ```
   ---
   title: Fix "Blocked by CORS Policy" in Node.js and Express
   published: true
   tags: node, express, javascript, webdev
   canonical_url: https://techsetup.site/blog/how-to-fix-cors-errors-in-nodejs-and-express-step-by-step
   ---
   ```
   Publicar o conteúdo completo e fechar com link para os guias relacionados.
2. **Hashnode** — mesmo artigo, campo "Original article URL" (canonical).
3. **Reddit** — r/node (CORS), r/webdev, r/LovableDev / r/ClaudeAI / r/opencode (guias de ferramenta).
   Postar como pergunta resolvida ou "o que aprendi", com o link no fim. Ler as regras de cada sub antes.
4. **Respostas no Stack Overflow / Reddit** a perguntas reais sobre CORS e Discord echo, linkando o guia
   só quando responde de fato. Link em resposta de qualidade vale mais que post próprio.
5. **GitHub** — adicionar o link no README de um repo próprio relacionado (ex.: exemplo de bot Discord).

## Métrica de sucesso (revisar em 2026-11-20)

- Backlinks de domínios distintos no GSC (Links) > 5
- Páginas indexadas > 20 (hoje 5)
- ≥15 cliques/mês no GSC
