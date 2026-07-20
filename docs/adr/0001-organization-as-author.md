# ADR 0001 — Organization as Author

**Data:** 2026-07-20
**Status:** Aceito

## Contexto

O Tech Setup é um Faceless Niche Site: não há Pessoa visível como autor dos
artigos. O Google, via Helpful Content Update e sinais de E-E-A-T
(Experience, Expertise, Authoritativeness, Trustworthiness), exige evidência
de autoria confiável em JSON-LD `Article` para ranquear bem.

Precisávamos decidir como representar a autoria no schema sem recorrer a
um autor humano visível.

## Decisão

`author` no JSON-LD `Article` aponta para uma `Organization` ("Tech Setup"),
não para uma `Person`. O campo `publisher` é a mesma `Organization`. Não
usamos pseudônimo Pessoa fictícia.

## Alternativas Consideradas

1. **Sem campo `author`.** Só `publisher` e datas de publicação/modificação.
   Rejeitado: a omissão é um sinal negativo explícito para o Helpful Content
   Update.
2. **Pseudônimo Person coerente.** `Person` fictícia com bio, foto de avatar
   e descriptions consistentes. Rejeitado: eticamente cinza (induz leitor a
   crer que uma pessoa existe) e caro de manter coesão a longo prazo.
3. **Organization as author (escolhida).** Padrão adotado por sites faceless
   legítimos (ex: equipes editoriais de revisões). Satisfaz E-E-A-T via
   entidade organizacional而没有 inventar uma pessoa.

## Consequências

- JSON-LD `Article` ripa: `author` e `publisher` são a mesma `Organization`.
- A confiança editorial vem de três sinais combinados:
  - `/about` documentando política editorial e o papel humano do Reviewer
  - `datePublished` / `dateModified` rigorosos
  - Revisão humana de todo conteúdo antes de `published`
- Se no futuro quisermos trazer um autor humano real, é uma mudença de um
  campo no schema + uma página de bio — baixo custo de reversão.