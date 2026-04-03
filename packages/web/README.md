# Argenta-Tui Web Docs

Camada de documentação pública do `argenta-tui`, construída com Astro + Starlight.

## Papel desta pasta

Esta pasta sustenta a documentação web e parte da superfície pública do produto. Aqui vivem:

- docs iniciais e de onboarding
- i18n documental prioritário
- páginas ligadas à narrativa pública do fork
- documentação correlata de runtime, providers e setup

## Relação com a 4.9

Na trilha de sanitização pública, esta pasta é tratada como superfície visível ao usuário. Portanto, starter kits, links de template e narrativa upstream genérica devem ser removidos ou substituídos por documentação coerente com a identidade Argenta.

## Desenvolvimento local

Do root do repo:

```bash
bun run --cwd packages/web dev
```

Build local:

```bash
bun run --cwd packages/web build
```

Preview local:

```bash
bun run --cwd packages/web preview
```

## Conteúdo prioritário

As superfícies documentais mais sensíveis desta fase ficam em:

- `src/content/docs/`
- `src/content/i18n/`

Idiomas mantidos prioritariamente nesta frente:

- `pt-BR`
- `en`
- `es`

## Observação de governança

Sincronização com o upstream OpenCode não deve ser espelhamento cego. Alterações nesta pasta precisam respeitar a política documental do fork e preservar a narrativa pública do Rabelus Lab.
