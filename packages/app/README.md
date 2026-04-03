# Argenta-Tui App Shell

Shell visual compartilhada do Argenta-Tui.

## Papel desta pasta

`packages/app` concentra a WebUI que também serve de base para a experiência visual usada no desktop. Ela participa da fachada pública do produto, mas também mantém contratos internos herdados da linhagem OpenCode.

Nesta pasta vivem, entre outras coisas:

- layout principal da app
- rotas e páginas da WebUI
- onboarding e seleção de providers
- i18n de superfície
- integração visual com o runtime local

## Regra da 4.9

Aqui, o saneamento deve distinguir com cuidado:

- **branding visível** — títulos, links públicos, textos, help/feedback, labels, metadados de superfície
- **contratos herdados** — `@opencode-ai/*`, `opencode://`, `__OPENCODE__`, storage `opencode.*` e outros pontos de compatibilidade

## Desenvolvimento local

Backend local, a partir de `packages/opencode`:

```bash
bun run --conditions=browser ./src/index.ts serve --port 4096
```

App local, a partir de `packages/app`:

```bash
bun dev -- --port 4444
```

Abrir:

```text
http://localhost:4444
```

## E2E

Os testes E2E dependem de backend local e ambiente preparado. Fluxo base:

```bash
bunx playwright install
bun run test:e2e:local
```

## Observação operacional

Esta pasta ainda participa da dívida de validação automatizada do projeto. A regularização completa de typecheck/build/test ficará conectada ao workflow pós-lançamento `7.7`, sem apagar as correções de rebranding visual da `4.9`.
