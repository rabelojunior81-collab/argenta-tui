# Argenta Desktop Electron

Shell desktop baseada em Electron para experimentação/empacotamento alternativo do Argenta-Tui.

## Papel desta pasta

Esta pasta não é a shell desktop principal da fase atual. O foco operacional da `4.9` e da superfície pública desktop está concentrado em `packages/desktop`.

`packages/desktop-electron` deve ser lida como trilha alternativa/legada do desktop, e por isso precisa evitar READMEs órfãos ou instruções apontando para outros pacotes como se fossem a mesma coisa.

## Desenvolvimento local

Do root do repo:

```bash
bun run --cwd packages/desktop-electron dev
```

## Build

```bash
bun run --cwd packages/desktop-electron build
```

Empacotamento:

```bash
bun run --cwd packages/desktop-electron package
```

## Observação de governança

Como esta pasta ainda carrega bastante herança upstream em metadata e configuração, qualquer rebrand adicional aqui deve ser tratado com cautela e separado da shell desktop principal para não confundir a superfície pública do produto.
