<p align="center">
  <img src="docs/assets/brand/argenta-phoenix-logo.png" alt="Logo Phoenix da Argenta Inception" width="320">
</p>

<h1 align="center">Argenta-Tui</h1>

<p align="center"><strong>Terminal Multi-Agêntico do Rabelus Lab</strong></p>

<p align="center">
  Fork do OpenCode com identidade própria, soluções proprietárias e integração direta com o ecossistema core do Rabelus Lab.
</p>

<p align="center">
  <a href="https://github.com/rabelojunior81-collab/argenta-tui">Repositório Oficial</a>
  ·
  <a href="docs/index.html">Landing GitHub Pages</a>
  ·
  <a href="https://github.com/anomalyco/opencode">OpenCode Upstream</a>
</p>

---

[![Screenshot do Argenta-Tui](docs/assets/screenshots/argenta-tui.jpeg)](docs/index.html)

## O que é

O **Argenta-Tui** é a camada terminal do ecossistema do **Rabelus Lab**: um ambiente multi-agêntico para desenvolvimento assistido por IA, construído sobre a base do OpenCode e expandido com direção própria.

Ele nasce da mesma linhagem técnica que o upstream, mas segue uma trilha autoral em:

- identidade visual Phoenix / Argenta
- narrativa e posicionamento de produto
- integração com o core de ferramentas do Rabelus Lab
- fluxo de distribuição e operação sob a marca `argenta-fenix`

## Posicionamento oficial

O Argenta-Tui se apresenta como:

- **fork com identidade própria**
- **fork com soluções proprietárias**
- **parte integrante do core do Rabelus Lab**
- **membro orgulhoso da comunidade OpenCode**

Não escondemos a origem. Pelo contrário: reconhecemos com respeito a base construída pela comunidade OpenCode e seguimos evoluindo essa linhagem com foco, rebranding e integração de ecossistema.

## O que diferencia o Argenta-Tui

- **Identidade Phoenix**: linguagem visual, branding e atmosfera próprios
- **Runtime + clientes**: TUI como frente principal, mas já conectado a WebUI, Desktop, VS Code e fluxo headless
- **Ecossistema integrado**: encaixe nativo com os componentes centrais do Rabelus Lab
- **Arquitetura herdada e expandida**: compatibilidade conceitual com OpenCode, mas com direção própria

## Ecossistema Rabelus Lab

O Argenta-Tui não é uma peça isolada. Ele compõe um ecossistema maior de ferramentas unificadas e interligadas, servindo como interface operacional de um núcleo mais amplo do laboratório.

Na prática, isso significa que o TUI é pensado para conversar com outros blocos do stack Argenta, incluindo runtime, gateway, kernel e fluxos de automação do laboratório.

## Argenta como framework em evolução

O rebranding público desta fase precisa deixar claro que o `argenta-tui` não é só um terminal bonito. Ele é a porta de entrada de um framework/ecossistema maior do Rabelus Lab, hoje organizado em frentes complementares:

- **`argenta-tui`** — interface operacional e fork principal da linhagem OpenCode
- **`argenta-kernel`** — núcleo agentic, memória, eventos e orquestração interna
- **`argenta-gateway`** — camada de providers, streaming e integração API
- **`argenta-infra`** — bootstrap, instalação, compose, health checks e operação local
- **`argenta-skills`** — biblioteca de capacidades e extensões de comportamento
- **`argenta-docs`** — documentação viva e trilha de manutenção do ecossistema

O `argenta-tui` é a face pública mais visível dessa arquitetura, mas não resume sozinho o framework.

## Superfícies públicas atuais

Nesta fase, o Argenta-Tui já deve ser entendido como um produto com múltiplas superfícies públicas conectadas ao mesmo backbone de runtime:

- **TUI** — interface terminal principal e frente operacional do produto
- **WebUI** — shell compartilhada em `packages/app`
- **Desktop** — wrapper nativo da WebUI em `packages/desktop`
- **VS Code** — extensão pública em `sdks/vscode`
- **`serve`** — runtime/headless backbone que conecta clientes, sessões e automações

Esses canais existem sobre a mesma espinha de runtime. O objetivo do rebranding não é esconder essa topologia, e sim torná-la inteligível e coerente.

## Como o framework se organiza

Hoje, a leitura mais fiel do Argenta é esta:

- o **TUI** é a frente soberana de operação
- o **`serve`** funciona como backbone de runtime e integração
- a **WebUI** e o **Desktop** ocupam a camada de shell visual/nativa
- a **extensão VS Code** ocupa a camada de integração com IDE
- o **kernel**, o **gateway**, a **infra** e as **skills** compõem o framework operacional por trás da interface pública

Essa distinção importa porque evita reduzir o projeto a "um fork do OpenCode rebrandado" quando, na prática, ele já está sendo reposicionado como parte de um framework vivo do Rabelus Lab.

## Relação com o OpenCode

O OpenCode é a nossa base upstream e parte importante da comunidade à qual pertencemos com orgulho.

O Argenta-Tui não tenta apagar essa origem. A proposta é outra:

- honrar a base comunitária
- preservar a transparência técnica
- evoluir uma identidade pública própria
- construir soluções adicionais sob a visão do Rabelus Lab

## Estado atual de distribuição

Hoje, o **ponto público oficial** do Argenta-Tui é este repositório GitHub.

O projeto já possui:

- repositório próprio
- assets oficiais de marca
- landing pública preparada para GitHub Pages

O fluxo de distribuição segue a arquitetura conceitual do OpenCode, mas está sendo consolidado sob a identidade Argenta. Nesta fase, o caminho mais confiável para exploração e desenvolvimento continua sendo o uso direto do repositório.

Ao mesmo tempo, a narrativa pública do fork passa a reconhecer explicitamente que o terminal é a face principal, mas não a única: WebUI, Desktop, VS Code e `serve` já fazem parte da topologia do produto.

Também passa a reconhecer que o `argenta-tui` é uma peça do framework Argenta, e não um produto isolado desconectado de `kernel`, `gateway`, `infra`, `skills` e documentação.

## Primeiros passos

```bash
git clone https://github.com/rabelojunior81-collab/argenta-tui
cd argenta-tui
bun install
bun run dev
```

Isso inicia a base atual do projeto a partir do código-fonte.

## Direção de produto

O objetivo do Argenta-Tui é se tornar a interface terminal soberana do Rabelus Lab para trabalho multi-agêntico, preservando a potência do OpenCode e levando essa base para uma identidade mais coesa, brasileira, ecossistêmica e proprietária.

Em termos mais amplos, a direção é esta:

- consolidar o `argenta-tui` como fachada pública e operacional do framework
- manter compatibilidade suficiente com a linhagem OpenCode para updates futuros
- expandir a operação para múltiplos canais sem perder coerência de runtime
- sustentar uma trilha de produção/manutenção com governança, evidência e segurança

## Documentação pública imediata

- `README.md` — landing principal do repositório
- `docs/index.html` — landing preparada para GitHub Pages
- `sdks/vscode/README.md` — superfície pública da extensão VS Code
- `packages/web/src/content/docs/server.mdx` — documentação correlata do runtime `serve`

## Leitura honesta do estágio atual

O que já está claro nesta fase:

- a identidade pública Phoenix/Argenta já existe
- a linhagem OpenCode está assumida de forma explícita
- os canais `TUI`, `WebUI`, `Desktop`, `VS Code` e `serve` já fazem parte da narrativa oficial
- o `argenta-tui` já é tratado como parte do framework/ecossistema Rabelus Lab

O que ainda está em consolidação:

- publicação da primeira release oficial com identidade própria
- saneamento completo das superfícies secundárias e semipúblicas
- formalização plena da trilha de Dev-Produção e manutenção contínua

## Contribuição

Se você participa da comunidade OpenCode, chega em casa aqui também.

Se você acompanha o Rabelus Lab, o Argenta-Tui é uma das peças centrais dessa construção.

Contribuições, leituras críticas, auditorias de branding e melhorias de operação são bem-vindas dentro da evolução do projeto.

## Reconhecimento

**Com honra à comunidade OpenCode** e com direção própria do **Rabelus Lab**.
