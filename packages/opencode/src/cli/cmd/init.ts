import { cmd } from "./cmd"
import open from "open"
import fs from "fs/promises"
import path from "path"
import { xdgData, xdgConfig } from "xdg-basedir"
import os from "os"
import { UI } from "../ui"

const PORT = 3333

function configDir() {
  return path.join(xdgConfig ?? path.join(os.homedir(), ".config"), "opencode")
}

function dataDir() {
  return path.join(xdgData ?? path.join(os.homedir(), ".local", "share"), "opencode")
}

async function readJson(file: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8"))
  } catch {
    return {}
  }
}

async function writeJson(file: string, data: Record<string, unknown>) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8")
}

async function saveProvider(payload: {
  provider: string
  apiKey?: string
  localEndpoint?: string
  localApiKey?: string
}) {
  const cfgFile = path.join(configDir(), "opencode.json")
  const authFile = path.join(dataDir(), "auth.json")

  const providerModels: Record<string, { model: string; npm?: string; api?: string }> = {
    anthropic: { model: "anthropic/claude-sonnet-4-6" },
    openai: { model: "openai/gpt-4o" },
    google: { model: "google/gemini-2.0-flash" },
    local: { model: "argenta/default", npm: "@ai-sdk/openai-compatible" },
  }

  const meta = providerModels[payload.provider]
  if (!meta) throw new Error(`Provider desconhecido: ${payload.provider}`)

  const cfg = await readJson(cfgFile)

  if (payload.provider === "local") {
    const endpoint = payload.localEndpoint || "http://localhost:8000/v1"
    const apiKey = payload.localApiKey || "argenta-secret-key"
    cfg.model = "argenta/default"
    cfg.provider = {
      ...(cfg.provider as Record<string, unknown>),
      argenta: {
        name: "Argenta Kernel (Local)",
        npm: "@ai-sdk/openai-compatible",
        api: endpoint,
        options: { apiKey },
        models: {
          default: {
            name: "Argenta Core",
            cost: { input: 0, output: 0 },
            limit: { context: 32000, output: 8192 },
          },
        },
      },
    }
    await writeJson(cfgFile, cfg)
  } else {
    cfg.model = meta.model
    await writeJson(cfgFile, cfg)

    if (payload.apiKey) {
      const auth = await readJson(authFile)
      auth[payload.provider] = { type: "api", key: payload.apiKey }
      await writeJson(authFile, auth)
    }
  }
}

const WIZARD_HTML = /* html */ `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Argenta Inception — Setup</title>
<style>
:root {
  --olive-200: #e4eed0;
  --olive-300: #cde0ab;
  --olive-400: #afcb7d;
  --olive-500: #8fb054;
  --olive-600: #6f8c3c;
  --olive-700: #556b30;
  --bg-base: #101409;
  --glass-bg: rgba(69,85,42,0.15);
  --glass-border: rgba(175,203,125,0.3);
  --glass-strong: rgba(69,85,42,0.4);
  --text-main: #f3f8e9;
  --text-muted: #afcb7d;
  --phoenix: #FF4500;
  --gold: #FFD700;
}
*{box-sizing:border-box;margin:0;padding:0;border-radius:0!important}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  background-color:var(--bg-base);
  color:var(--text-main);
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background-image:
    linear-gradient(rgba(175,203,125,0.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(175,203,125,0.03) 1px,transparent 1px);
  background-size:30px 30px;
  background-attachment:fixed;
}
.container{width:100%;max-width:540px;padding:20px}
.card{
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  padding:40px;
}
.logo{
  text-align:center;
  margin-bottom:32px;
}
.logo-title{
  font-size:2rem;
  font-weight:800;
  letter-spacing:3px;
  text-transform:uppercase;
  color:var(--olive-200);
}
.logo-title span{color:var(--phoenix)}
.logo-sub{
  font-size:0.8rem;
  color:var(--text-muted);
  letter-spacing:2px;
  text-transform:uppercase;
  margin-top:4px;
}
.step{display:none}
.step.active{display:block}
h2{
  font-size:1.1rem;
  color:var(--olive-300);
  text-transform:uppercase;
  letter-spacing:1px;
  margin-bottom:20px;
  border-bottom:1px solid var(--glass-border);
  padding-bottom:10px;
}
.provider-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-bottom:24px;
}
.provider-btn{
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  color:var(--text-main);
  padding:16px 12px;
  cursor:pointer;
  text-align:center;
  font-size:0.9rem;
  transition:all 0.15s;
}
.provider-btn:hover{
  border-color:var(--olive-500);
  background:var(--glass-strong);
}
.provider-btn.selected{
  border-color:var(--phoenix);
  background:rgba(255,69,0,0.1);
}
.provider-btn .icon{font-size:1.5rem;display:block;margin-bottom:6px}
.provider-btn .name{font-weight:600;color:var(--olive-200)}
.provider-btn .desc{font-size:0.75rem;color:var(--text-muted);margin-top:2px}
label{
  display:block;
  font-size:0.8rem;
  color:var(--text-muted);
  text-transform:uppercase;
  letter-spacing:1px;
  margin-bottom:6px;
}
input[type=text],input[type=password],input[type=url]{
  width:100%;
  background:rgba(20,26,11,0.8);
  border:1px solid var(--glass-border);
  color:var(--text-main);
  padding:10px 14px;
  font-family:monospace;
  font-size:0.9rem;
  margin-bottom:16px;
  outline:none;
  transition:border-color 0.15s;
}
input:focus{border-color:var(--olive-500)}
.btn{
  display:inline-block;
  background:var(--olive-600);
  border:1px solid var(--olive-500);
  color:var(--text-main);
  padding:12px 28px;
  font-size:0.9rem;
  font-weight:600;
  cursor:pointer;
  letter-spacing:1px;
  text-transform:uppercase;
  transition:all 0.15s;
  width:100%;
}
.btn:hover{background:var(--olive-500)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-secondary{
  background:transparent;
  border-color:var(--glass-border);
  margin-top:8px;
}
.btn-secondary:hover{border-color:var(--olive-400);background:var(--glass-bg)}
.alert{
  padding:14px 16px;
  border:1px solid var(--glass-border);
  border-left:4px solid var(--olive-500);
  background:var(--glass-bg);
  margin-bottom:16px;
  font-size:0.85rem;
  color:var(--text-muted);
}
.alert.danger{border-left-color:#c94f4f;color:#e8a0a0}
.progress{
  display:flex;
  gap:8px;
  margin-bottom:28px;
}
.progress-dot{
  width:8px;height:8px;
  border:1px solid var(--glass-border);
  flex-shrink:0;
  transition:all 0.2s;
}
.progress-dot.done{background:var(--olive-500);border-color:var(--olive-500)}
.progress-dot.active{background:var(--phoenix);border-color:var(--phoenix)}
.success-icon{text-align:center;font-size:3rem;margin:16px 0 24px}
.success-msg{text-align:center;color:var(--olive-300);margin-bottom:24px;line-height:1.7}
.success-cmd{
  background:rgba(20,26,11,0.9);
  border:1px solid var(--glass-border);
  border-left:4px solid var(--phoenix);
  padding:12px 16px;
  font-family:monospace;
  color:var(--gold);
  font-size:1rem;
  text-align:center;
  margin-bottom:8px;
}
.skip-link{
  text-align:center;
  margin-top:16px;
  font-size:0.8rem;
}
.skip-link a{color:var(--text-muted);cursor:pointer;border-bottom:1px solid transparent}
.skip-link a:hover{color:var(--olive-300);border-bottom-color:var(--olive-300)}
</style>
</head>
<body>
<div class="container">
<div class="card">
  <div class="logo">
    <div class="logo-title">&#9650; <span>Argenta</span> Inception</div>
    <div class="logo-sub">Setup Wizard</div>
  </div>

  <div class="progress" id="progress">
    <div class="progress-dot active" id="dot-0"></div>
    <div class="progress-dot" id="dot-1"></div>
    <div class="progress-dot" id="dot-2"></div>
  </div>

  <!-- Step 0: Provider Selection -->
  <div class="step active" id="step-0">
    <h2>Escolha seu provedor de IA</h2>
    <div class="provider-grid">
      <button class="provider-btn" data-provider="anthropic" onclick="selectProvider(this)">
        <span class="icon">&#9670;</span>
        <div class="name">Anthropic</div>
        <div class="desc">Claude 3.5/4</div>
      </button>
      <button class="provider-btn" data-provider="openai" onclick="selectProvider(this)">
        <span class="icon">&#9643;</span>
        <div class="name">OpenAI</div>
        <div class="desc">GPT-4o / o3</div>
      </button>
      <button class="provider-btn" data-provider="google" onclick="selectProvider(this)">
        <span class="icon">&#9670;</span>
        <div class="name">Google</div>
        <div class="desc">Gemini 2.0+</div>
      </button>
      <button class="provider-btn" data-provider="local" onclick="selectProvider(this)">
        <span class="icon">&#9651;</span>
        <div class="name">Local</div>
        <div class="desc">Ollama / Argenta</div>
      </button>
    </div>
    <button class="btn" id="btn-next-0" onclick="goToStep(1)" disabled>Continuar</button>
  </div>

  <!-- Step 1: Credentials -->
  <div class="step" id="step-1">
    <h2 id="creds-title">Configurar acesso</h2>
    <div id="creds-cloud">
      <div class="alert">
        A chave de API é armazenada localmente e nunca é enviada para servidores externos.
      </div>
      <label>Chave de API</label>
      <input type="password" id="api-key" placeholder="sk-..." autocomplete="off">
    </div>
    <div id="creds-local" style="display:none">
      <div class="alert">
        Configure o endpoint do servidor local compatível com OpenAI.
      </div>
      <label>Endpoint da API</label>
      <input type="url" id="local-endpoint" placeholder="http://localhost:8000/v1" value="http://localhost:8000/v1">
      <label>Chave de API (opcional)</label>
      <input type="password" id="local-apikey" placeholder="argenta-secret-key" autocomplete="off">
    </div>
    <div id="creds-error" class="alert danger" style="display:none"></div>
    <button class="btn" id="btn-save" onclick="saveConfig()">Salvar e Continuar</button>
    <button class="btn btn-secondary" onclick="goToStep(0)">&#8592; Voltar</button>
  </div>

  <!-- Step 2: Done -->
  <div class="step" id="step-2">
    <h2>Configurado com sucesso</h2>
    <div class="success-icon">&#9650;</div>
    <p class="success-msg">
      A Argenta Inception está pronta para decolar.<br>
      Execute no terminal para iniciar:
    </p>
    <div class="success-cmd">argenta</div>
    <p class="success-msg" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">
      Esta janela pode ser fechada.
    </p>
  </div>

</div>
</div>

<script>
let selectedProvider = null

function selectProvider(btn) {
  document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('selected'))
  btn.classList.add('selected')
  selectedProvider = btn.dataset.provider
  document.getElementById('btn-next-0').disabled = false
}

function goToStep(n) {
  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.toggle('active', i === n)
  })
  document.querySelectorAll('.progress-dot').forEach((d, i) => {
    d.classList.remove('active', 'done')
    if (i < n) d.classList.add('done')
    else if (i === n) d.classList.add('active')
  })
  if (n === 1) setupCredsStep()
}

function setupCredsStep() {
  const isLocal = selectedProvider === 'local'
  document.getElementById('creds-cloud').style.display = isLocal ? 'none' : 'block'
  document.getElementById('creds-local').style.display = isLocal ? 'block' : 'none'
  const titles = {
    anthropic: 'Chave API — Anthropic',
    openai: 'Chave API — OpenAI',
    google: 'Chave API — Google',
    local: 'Servidor local',
  }
  document.getElementById('creds-title').textContent = titles[selectedProvider] || 'Configurar acesso'
  document.getElementById('creds-error').style.display = 'none'
}

async function saveConfig() {
  const btn = document.getElementById('btn-save')
  btn.disabled = true
  btn.textContent = 'Salvando...'
  document.getElementById('creds-error').style.display = 'none'

  const payload = { provider: selectedProvider }
  if (selectedProvider === 'local') {
    payload.localEndpoint = document.getElementById('local-endpoint').value.trim() || 'http://localhost:8000/v1'
    payload.localApiKey = document.getElementById('local-apikey').value.trim()
  } else {
    payload.apiKey = document.getElementById('api-key').value.trim()
    if (!payload.apiKey) {
      showError('Chave de API obrigatória')
      btn.disabled = false
      btn.textContent = 'Salvar e Continuar'
      return
    }
  }

  try {
    const res = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.ok) {
      showError(data.error || 'Erro ao salvar configuração')
      btn.disabled = false
      btn.textContent = 'Salvar e Continuar'
      return
    }
    goToStep(2)
  } catch (e) {
    showError('Falha ao comunicar com o servidor de setup')
    btn.disabled = false
    btn.textContent = 'Salvar e Continuar'
  }
}

function showError(msg) {
  const el = document.getElementById('creds-error')
  el.textContent = msg
  el.style.display = 'block'
}
</script>
</body>
</html>`

export const InitCommand = cmd({
  command: "init",
  describe: "assistente de configuração inicial da Argenta Inception",
  handler: async () => {
    const url = `http://localhost:${PORT}`

    let done = false
    let resolveExit: () => void
    const exitSignal = new Promise<void>((r) => (resolveExit = r))

    const server = Bun.serve({
      port: PORT,
      async fetch(req) {
        const path = new URL(req.url).pathname

        if (req.method === "GET" && path === "/") {
          return new Response(WIZARD_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        }

        if (req.method === "POST" && path === "/save") {
          try {
            const payload = (await req.json()) as Parameters<typeof saveProvider>[0]
            await saveProvider(payload)
            done = true
            setTimeout(() => resolveExit(), 800)
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            })
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            return new Response(JSON.stringify({ ok: false, error: msg }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }
        }

        return new Response("Not Found", { status: 404 })
      },
      error(e) {
        UI.println(UI.Style.TEXT_DANGER_BOLD + "Erro no servidor de setup: " + UI.Style.TEXT_NORMAL + e.message)
      },
    })

    UI.empty()
    UI.println(UI.logo("  "))
    UI.empty()
    UI.println(UI.Style.TEXT_INFO_BOLD + "  Setup Wizard:    ", UI.Style.TEXT_NORMAL, url)
    UI.empty()

    open(url).catch(() => {
      UI.println(UI.Style.TEXT_WARNING_BOLD + "  Não foi possível abrir o browser automaticamente.")
      UI.println(UI.Style.TEXT_NORMAL + "  Acesse manualmente: " + url)
    })

    await exitSignal
    server.stop(true)
    UI.empty()
    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "  Configuracao salva com sucesso.")
    UI.println(UI.Style.TEXT_NORMAL + "  Execute " + UI.Style.TEXT_HIGHLIGHT_BOLD + "argenta" + UI.Style.TEXT_NORMAL + " para iniciar.")
    UI.empty()
  },
})
