// init-standalone.ts
// Entry point standalone para o Bootstrap Wizard
// Rodar com: bun run src/cli/cmd/init-standalone.ts

import open from "open"
import fs from "fs/promises"
import path from "path"
import { xdgData, xdgConfig } from "xdg-basedir"
import os from "os"

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

const PROVIDER_MODELS: Record<string, { models: string[]; default: string }> = {
  anthropic: {
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
    default: "claude-sonnet-4-6",
  },
  openai: {
    models: ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"],
    default: "gpt-5.4-mini",
  },
  google: {
    models: ["gemini-3-flash-preview", "gemini-2.5-flash"],
    default: "gemini-3-flash-preview",
  },
  chatgpt: {
    models: ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"],
    default: "gpt-5.4",
  },
  local: {
    models: ["argenta/default"],
    default: "argenta/default",
  },
}

async function checkServices() {
  const results: { ollama: boolean; gateway: boolean } = { ollama: false, gateway: false }
  try {
    const ollamaRes = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2000) })
    results.ollama = ollamaRes.ok
  } catch {}
  try {
    const gwRes = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(2000) })
    results.gateway = gwRes.ok
  } catch {}
  return results
}

let gatewayProcess: ReturnType<typeof Bun.spawn> | null = null
let ollamaProcess: ReturnType<typeof Bun.spawn> | null = null

async function checkDockerAvailable(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["docker", "--version"], { stdout: "pipe", stderr: "pipe" })
    const exitCode = await proc.exited
    return exitCode === 0
  } catch {
    return false
  }
}

async function startGateway(): Promise<{ started: boolean; error?: string }> {
  const health = await checkServices()
  if (health.gateway) {
    return { started: false }
  }
  
  const infraPath = path.join(__dirname, "../../../../argenta-infra")
  const gatewayPath = path.join(__dirname, "../../../../argenta-gateway")
  const dockerAvailable = await checkDockerAvailable()
  
  if (dockerAvailable) {
    try {
      const proc = Bun.spawn({
        cmd: ["docker", "compose", "up", "-d", "gateway"],
        cwd: infraPath,
        stdout: "pipe",
        stderr: "pipe",
      })
      await proc.exited
      await new Promise((r) => setTimeout(r, 3000))
      const check = await checkServices()
      if (check.gateway) {
        return { started: true }
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      return { started: false, error: `Docker falhou: ${err}` }
    }
  }
  
  try {
    gatewayProcess = Bun.spawn({
      cmd: ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
      cwd: gatewayPath,
      stdout: "pipe",
      stderr: "pipe",
    })
    await new Promise((r) => setTimeout(r, 3000))
    const check = await checkServices()
    if (check.gateway) {
      return { started: true }
    }
    return { started: false, error: "Gateway não iniciou em tempo hábil" }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { started: false, error: `Falha ao iniciar Gateway: ${err}` }
  }
}

async function startOllama(): Promise<{ started: boolean; error?: string }> {
  const health = await checkServices()
  if (health.ollama) {
    return { started: false }
  }
  
  const infraPath = path.join(__dirname, "../../../../argenta-infra")
  const dockerAvailable = await checkDockerAvailable()
  
  if (dockerAvailable) {
    try {
      const proc = Bun.spawn({
        cmd: ["docker", "compose", "up", "-d", "ollama"],
        cwd: infraPath,
        stdout: "pipe",
        stderr: "pipe",
      })
      await proc.exited
      await new Promise((r) => setTimeout(r, 5000))
      const check = await checkServices()
      if (check.ollama) {
        return { started: true }
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      return { started: false, error: `Docker falhou: ${err}` }
    }
  }
  
  return { 
    started: false, 
    error: "Docker não encontrado. Inicie manualmente: cd argenta-infra && docker compose up -d ollama" 
  }
}

async function startLocalServices(): Promise<{ ollama: boolean; gateway: boolean; errors: string[] }> {
  const errors: string[] = []
  const ollamaResult = await startOllama()
  if (ollamaResult.error && !ollamaResult.started) {
    errors.push(`Ollama: ${ollamaResult.error}`)
  }
  const gatewayResult = await startGateway()
  if (gatewayResult.error && !gatewayResult.started) {
    errors.push(`Gateway: ${gatewayResult.error}`)
  }
  const health = await checkServices()
  return { ollama: health.ollama, gateway: health.gateway, errors }
}

async function getOllamaModels() {
  try {
    const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return []
    const data = (await res.json()) as { models?: { name: string }[] }
    return data.models?.map((m) => m.name) ?? []
  } catch {
    return []
  }
}

async function startChatGPTOAuth() {
  const clientId = "app_EMoamEEZ73f0CkXaXp7hrann"
  const issuer = "https://auth.openai.com"
  try {
    const res = await fetch(`${issuer}/oauth/device/code`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `client_id=${clientId}&scope=openid%20profile%20email%20offline_access`,
    })
    if (!res.ok) throw new Error("Falha ao iniciar OAuth")
    return (await res.json()) as { device_code: string; user_code: string; verification_uri: string; expires_in: number }
  } catch (e) {
    throw new Error(`OAuth init failed: ${e}`)
  }
}

async function pollChatGPTToken(deviceCode: string) {
  const clientId = "app_EMoamEEZ73f0CkXaXp7hrann"
  const issuer = "https://auth.openai.com"
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    try {
      const res = await fetch(`${issuer}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${deviceCode}&client_id=${clientId}`,
      })
      if (res.status === 200) {
        return (await res.json()) as { access_token: string; refresh_token?: string }
      }
    } catch {}
  }
  throw new Error("OAuth timeout")
}

async function saveProvider(payload: {
  provider: string
  apiKey?: string
  selectedModel?: string
  localEndpoint?: string
  localApiKey?: string
  ollamaModel?: string
  oauthToken?: string
  refreshToken?: string
}) {
  const cfgFile = path.join(configDir(), "opencode.json")
  const authFile = path.join(dataDir(), "auth.json")

  const meta = PROVIDER_MODELS[payload.provider]
  if (!meta) throw new Error(`Provider desconhecido: ${payload.provider}`)

  const model = payload.selectedModel || meta.default
  const cfg = await readJson(cfgFile)

  if (payload.provider === "local") {
    if (payload.ollamaModel) {
      cfg.model = `ollama/${payload.ollamaModel}`
      cfg.provider = {
        ...(cfg.provider as Record<string, unknown>),
        ollama: { name: "Ollama", api: payload.localEndpoint || "http://localhost:11434" },
      }
    } else {
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
            default: { name: "Argenta Core", cost: { input: 0, output: 0 }, limit: { context: 32000, output: 8192 } },
          },
        },
      }
    }
    await writeJson(cfgFile, cfg)
  } else if (payload.provider === "chatgpt") {
    cfg.model = `openai/${model}`
    await writeJson(cfgFile, cfg)
    if (payload.oauthToken) {
      const auth = await readJson(authFile)
      auth.openai = { type: "oauth", token: payload.oauthToken, refresh: payload.refreshToken }
      await writeJson(authFile, auth)
    }
  } else {
    cfg.model = `${payload.provider}/${model}`
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
.logo{text-align:center;margin-bottom:24px}
.logo-title{font-size:2rem;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--olive-200)}
.logo-title span{color:var(--phoenix)}
.logo-sub{font-size:0.8rem;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;margin-top:4px}
.health-bar{display:flex;gap:12px;margin-bottom:24px;padding:10px;border:1px solid var(--glass-border);background:var(--glass-bg)}
.health-item{flex:1;text-align:center;font-size:0.75rem}
.health-item .label{color:var(--text-muted);margin-bottom:2px}
.health-item .status{font-weight:600}
.health-ok{color:var(--olive-400)}
.health-bad{color:#c94f4f}
.step{display:none}
.step.active{display:block}
h2{font-size:1.1rem;color:var(--olive-300);text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;border-bottom:1px solid var(--glass-border);padding-bottom:10px}
.provider-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.provider-btn{background:var(--glass-bg);border:1px solid var(--glass-border);color:var(--text-main);padding:16px 12px;cursor:pointer;text-align:center;font-size:0.9rem;transition:all 0.15s}
.provider-btn:hover{border-color:var(--olive-500);background:var(--glass-strong)}
.provider-btn.selected{border-color:var(--phoenix);background:rgba(255,69,0,0.1)}
.provider-btn .icon{font-size:1.5rem;display:block;margin-bottom:6px}
.provider-btn .name{font-weight:600;color:var(--olive-200)}
.provider-btn .desc{font-size:0.75rem;color:var(--text-muted);margin-top:2px}
label{display:block;font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
input[type=text],input[type=password],input[type=url]{width:100%;background:rgba(20,26,11,0.8);border:1px solid var(--glass-border);color:var(--text-main);padding:10px 14px;font-family:monospace;font-size:0.9rem;margin-bottom:16px;outline:none;transition:border-color 0.15s}
input:focus{border-color:var(--olive-500)}
select{width:100%;background:rgba(20,26,11,0.8);border:1px solid var(--glass-border);color:var(--text-main);padding:10px 14px;font-family:monospace;font-size:0.9rem;margin-bottom:16px;outline:none}
select:focus{border-color:var(--olive-500)}
.btn{display:inline-block;background:var(--olive-600);border:1px solid var(--olive-500);color:var(--text-main);padding:12px 28px;font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:1px;text-transform:uppercase;transition:all 0.15s;width:100%}
.btn:hover{background:var(--olive-500)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-secondary{background:transparent;border-color:var(--glass-border);margin-top:8px}
.btn-secondary:hover{border-color:var(--olive-400);background:var(--glass-bg)}
.alert{padding:14px 16px;border:1px solid var(--glass-border);border-left:4px solid var(--olive-500);background:var(--glass-bg);margin-bottom:16px;font-size:0.85rem;color:var(--text-muted)}
.alert.danger{border-left-color:#c94f4f;color:#e8a0a0}
.progress{display:flex;gap:8px;margin-bottom:28px}
.progress-dot{width:8px;height:8px;border:1px solid var(--glass-border);flex-shrink:0;transition:all 0.2s}
.progress-dot.done{background:var(--olive-500);border-color:var(--olive-500)}
.progress-dot.active{background:var(--phoenix);border-color:var(--phoenix)}
.success-icon{text-align:center;font-size:3rem;margin:16px 0 24px}
.success-msg{text-align:center;color:var(--olive-300);margin-bottom:24px;line-height:1.7}
.success-cmd{background:rgba(20,26,11,0.9);border:1px solid var(--glass-border);border-left:4px solid var(--phoenix);padding:12px 16px;font-family:monospace;color:var(--gold);font-size:1rem;text-align:center;margin-bottom:8px}
.oauth-code{background:rgba(20,26,11,0.9);border:1px solid var(--glass-border);padding:16px;text-align:center;margin-bottom:16px}
.oauth-code .code{font-size:2rem;font-weight:bold;color:var(--gold);letter-spacing:4px}
.oauth-code .url{font-size:0.85rem;color:var(--text-muted);margin-top:8px}
.ollama-status{margin-bottom:16px}
.ollama-models{background:rgba(20,26,11,0.6);border:1px solid var(--glass-border);padding:12px;margin-bottom:16px}
.ollama-model-item{display:flex;justify-content:space-between;padding:4px 0;font-size:0.85rem}
.ollama-model-item .name{color:var(--olive-200)}
.ollama-model-item .pull{color:var(--text-muted);cursor:pointer;text-decoration:underline}
.service-control{margin-bottom:16px}
.service-row{display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--glass-border);background:var(--glass-bg);margin-bottom:8px}
.service-row .svc-name{font-weight:600;color:var(--olive-200)}
.service-row .svc-status{font-size:0.8rem}
.svc-status.ok{color:var(--olive-400)}
.svc-status.error{color:#c94f4f}
.svc-status.starting{color:var(--gold)}
.btn-small{padding:6px 12px;font-size:0.75rem}
.error-box{background:rgba(201,79,79,0.1);border:1px solid #c94f4f;padding:12px;margin-bottom:16px;font-size:0.85rem;color:#e8a0a0}
</style>
</head>
<body>
<div class="container">
<div class="card">
  <div class="logo">
    <div class="logo-title">&#9650; <span>Argenta</span> Inception</div>
    <div class="logo-sub">Setup Wizard</div>
  </div>

  <div class="health-bar" id="health-bar">
    <div class="health-item">
      <div class="label">Ollama</div>
      <div class="status" id="health-ollama">...</div>
    </div>
    <div class="health-item">
      <div class="label">Gateway</div>
      <div class="status" id="health-gateway">...</div>
    </div>
  </div>

  <div class="progress" id="progress">
    <div class="progress-dot active" id="dot-0"></div>
    <div class="progress-dot" id="dot-1"></div>
    <div class="progress-dot" id="dot-2"></div>
    <div class="progress-dot" id="dot-3"></div>
  </div>

  <!-- Step 0: Provider Selection -->
  <div class="step active" id="step-0">
    <h2>Escolha seu provedor de IA</h2>
    <div class="provider-grid">
      <button class="provider-btn" data-provider="anthropic" onclick="selectProvider(this)">
        <span class="icon">&#9670;</span>
        <div class="name">Anthropic</div>
        <div class="desc">Claude 4.6</div>
      </button>
      <button class="provider-btn" data-provider="openai" onclick="selectProvider(this)">
        <span class="icon">&#9643;</span>
        <div class="name">OpenAI</div>
        <div class="desc">GPT-5.4 / mini / nano</div>
      </button>
      <button class="provider-btn" data-provider="google" onclick="selectProvider(this)">
        <span class="icon">&#9670;</span>
        <div class="name">Google</div>
        <div class="desc">Gemini 3.0 / 2.5</div>
      </button>
      <button class="provider-btn" data-provider="chatgpt" onclick="selectProvider(this)">
        <span class="icon">&#9644;</span>
        <div class="name">ChatGPT Plus/Pro</div>
        <div class="desc">OAuth Login</div>
      </button>
      <button class="provider-btn" data-provider="local" onclick="selectProvider(this)">
        <span class="icon">&#9651;</span>
        <div class="name">Local</div>
        <div class="desc">Ollama / Argenta</div>
      </button>
    </div>
    <button class="btn" id="btn-next-0" onclick="goToStep(1)" disabled>Continuar</button>
  </div>

  <!-- Step 1: Model Selection -->
  <div class="step" id="step-1">
    <h2 id="model-title">Selecione o modelo</h2>
    <div id="model-selector">
      <label>Modelo</label>
      <select id="model-select"></select>
    </div>
    <div id="ollama-config" style="display:none">
      <div class="service-control" id="service-control">
        <div class="service-row">
          <span class="svc-name">Ollama</span>
          <span class="svc-status" id="svc-ollama">...</span>
        </div>
        <div class="service-row">
          <span class="svc-name">Gateway</span>
          <span class="svc-status" id="svc-gateway">...</span>
        </div>
        <button class="btn btn-small" id="btn-start-services" onclick="startLocalServices()">Iniciar Serviços</button>
      </div>
      <div class="error-box" id="service-errors" style="display:none"></div>
      <div class="ollama-status" id="ollama-status"></div>
      <div class="ollama-models" id="ollama-models"></div>
      <label>Endpoint Ollama</label>
      <input type="url" id="ollama-endpoint" placeholder="http://localhost:11434" value="http://localhost:11434">
    </div>
    <button class="btn" id="btn-next-1" onclick="goToStep(2)">Continuar</button>
    <button class="btn btn-secondary" onclick="goToStep(0)">&#8592; Voltar</button>
  </div>

  <!-- Step 2: Credentials -->
  <div class="step" id="step-2">
    <h2 id="creds-title">Configurar acesso</h2>
    <div id="creds-cloud">
      <div class="alert">A chave de API é armazenada localmente.</div>
      <label>Chave de API</label>
      <input type="password" id="api-key" placeholder="sk-..." autocomplete="off">
    </div>
    <div id="creds-local" style="display:none">
      <div class="alert">Configure o endpoint local compatível com OpenAI.</div>
      <label>Endpoint da API</label>
      <input type="url" id="local-endpoint" placeholder="http://localhost:8000/v1" value="http://localhost:8000/v1">
      <label>Chave de API (opcional)</label>
      <input type="password" id="local-apikey" placeholder="argenta-secret-key" autocomplete="off">
    </div>
    <div id="creds-oauth" style="display:none">
      <div class="oauth-code" id="oauth-display">
        <div class="code" id="oauth-user-code">...</div>
        <div class="url" id="oauth-url">Acesse para autorizar</div>
      </div>
      <div class="alert" id="oauth-wait">Aguardando autorização...</div>
    </div>
    <div id="creds-error" class="alert danger" style="display:none"></div>
    <button class="btn" id="btn-save" onclick="saveConfig()">Salvar e Continuar</button>
    <button class="btn btn-secondary" onclick="goToStep(1)">&#8592; Voltar</button>
  </div>

  <!-- Step 3: Done -->
  <div class="step" id="step-3">
    <h2>Configurado com sucesso</h2>
    <div class="success-icon">&#9650;</div>
    <p class="success-msg">A Argenta Inception está pronta para decolar.<br>Execute no terminal para iniciar:</p>
    <div class="success-cmd">argenta</div>
    <p class="success-msg" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">Esta janela pode ser fechada.</p>
  </div>

</div>
</div>

<script>
let selectedProvider = null
let selectedModel = null
let ollamaModels = []
let healthData = { ollama: false, gateway: false }
let oauthData = null

async function loadHealth() {
  try {
    const res = await fetch('/health')
    healthData = await res.json()
    document.getElementById('health-ollama').textContent = healthData.ollama ? 'OK' : 'OFF'
    document.getElementById('health-ollama').className = 'status ' + (healthData.ollama ? 'health-ok' : 'health-bad')
    document.getElementById('health-gateway').textContent = healthData.gateway ? 'OK' : 'OFF'
    document.getElementById('health-gateway').className = 'status ' + (healthData.gateway ? 'health-ok' : 'health-bad')
  } catch {}
}
loadHealth()

async function loadOllamaModels() {
  try {
    const res = await fetch('/ollama-models')
    ollamaModels = await res.json()
    renderOllamaModels()
  } catch {
    ollamaModels = []
    renderOllamaModels()
  }
}

function renderOllamaModels() {
  const el = document.getElementById('ollama-models')
  if (ollamaModels.length === 0) {
    el.innerHTML = '<div style="color:var(--text-muted)">Nenhum modelo encontrado. Execute: <code style="color:var(--olive-400)">ollama pull gemma3:4b</code></div>'
  } else {
    el.innerHTML = ollamaModels.map(m => '<div class="ollama-model-item"><span class="name">' + m + '</span></div>').join('')
  }
}

function selectProvider(btn) {
  document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('selected'))
  btn.classList.add('selected')
  selectedProvider = btn.dataset.provider
  document.getElementById('btn-next-0').disabled = false
}

function goToStep(n) {
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i === n))
  document.querySelectorAll('.progress-dot').forEach((d, i) => {
    d.classList.remove('active', 'done')
    if (i < n) d.classList.add('done')
    else if (i === n) d.classList.add('active')
  })
  if (n === 1) setupModelStep()
  if (n === 2) setupCredsStep()
}

function setupModelStep() {
  const isLocal = selectedProvider === 'local'
  document.getElementById('model-selector').style.display = isLocal ? 'none' : 'block'
  document.getElementById('ollama-config').style.display = isLocal ? 'block' : 'none'
  const titles = {
    anthropic: 'Modelo Anthropic Claude',
    openai: 'Modelo OpenAI GPT',
    google: 'Modelo Google Gemini',
    chatgpt: 'Modelo ChatGPT',
    local: 'Configurar Ollama Local',
  }
  document.getElementById('model-title').textContent = titles[selectedProvider] || 'Selecione o modelo'
  if (!isLocal) {
    const models = {anthropic:['claude-opus-4-6','claude-sonnet-4-6','claude-haiku-4-5'],openai:['gpt-5.4','gpt-5.4-mini','gpt-5.4-nano'],google:['gemini-3-flash-preview','gemini-2.5-flash'],chatgpt:['gpt-5.4','gpt-5.4-mini','gpt-5.4-nano']}
    const list = models[selectedProvider] || []
    const sel = document.getElementById('model-select')
    sel.innerHTML = list.map(m => '<option value="' + m + '">' + m + '</option>').join('')
  } else {
    loadHealth().then(function() {
      updateServiceStatus(healthData)
    })
    loadOllamaModels()
  }
}

async function setupCredsStep() {
  selectedModel = document.getElementById('model-select')?.value || null
  const isLocal = selectedProvider === 'local'
  const isChatGPT = selectedProvider === 'chatgpt'
  document.getElementById('creds-cloud').style.display = (isLocal || isChatGPT) ? 'none' : 'block'
  document.getElementById('creds-local').style.display = isLocal ? 'block' : 'none'
  document.getElementById('creds-oauth').style.display = isChatGPT ? 'block' : 'none'
  const titles = {
    anthropic: 'Chave API — Anthropic',
    openai: 'Chave API — OpenAI',
    google: 'Chave API — Google',
    chatgpt: 'OAuth — ChatGPT Plus/Pro',
    local: 'Servidor local',
  }
  document.getElementById('creds-title').textContent = titles[selectedProvider] || 'Configurar acesso'
  document.getElementById('creds-error').style.display = 'none'
  if (isChatGPT) {
    try {
      const res = await fetch('/oauth-chatgpt')
      oauthData = await res.json()
      document.getElementById('oauth-user-code').textContent = oauthData.user_code
      document.getElementById('oauth-url').textContent = oauthData.verification_uri
      pollOAuth()
    } catch (e) {
      showError('Falha ao iniciar OAuth: ' + e)
    }
  }
}

async function pollOAuth() {
  try {
    const res = await fetch('/oauth-poll?code=' + oauthData.device_code)
    const data = await res.json()
    if (data.ok) {
      oauthData.access_token = data.access_token
      oauthData.refresh_token = data.refresh_token
      document.getElementById('oauth-wait').textContent = 'Autorizado!'
      document.getElementById('btn-save').disabled = false
    } else if (data.pending) {
      setTimeout(pollOAuth, 3000)
    } else {
      showError(data.error || 'OAuth timeout')
    }
  } catch {
    setTimeout(pollOAuth, 3000)
  }
}

async function saveConfig() {
  const btn = document.getElementById('btn-save')
  btn.disabled = true
  btn.textContent = 'Salvando...'
  document.getElementById('creds-error').style.display = 'none'

  const payload = { provider: selectedProvider, selectedModel }
  if (selectedProvider === 'local') {
    payload.localEndpoint = document.getElementById('ollama-endpoint')?.value || 'http://localhost:11434'
    payload.ollamaModel = ollamaModels[0] || 'gemma3:4b'
  } else if (selectedProvider === 'chatgpt') {
    payload.oauthToken = oauthData?.access_token
    payload.refreshToken = oauthData?.refresh_token
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
      showError(data.error || 'Erro ao salvar')
      btn.disabled = false
      btn.textContent = 'Salvar e Continuar'
      return
    }
    goToStep(3)
  } catch (e) {
    showError('Falha ao comunicar com servidor')
    btn.disabled = false
    btn.textContent = 'Salvar e Continuir'
  }
}

function showError(msg) {
  const el = document.getElementById('creds-error')
  el.textContent = msg
  el.style.display = 'block'
}

async function startLocalServices() {
  const btn = document.getElementById('btn-start-services')
  btn.disabled = true
  btn.textContent = 'Iniciando...'
  document.getElementById('svc-ollama').textContent = 'iniciando...'
  document.getElementById('svc-ollama').className = 'svc-status starting'
  document.getElementById('svc-gateway').textContent = 'iniciando...'
  document.getElementById('svc-gateway').className = 'svc-status starting'
  document.getElementById('service-errors').style.display = 'none'
  
  try {
    const res = await fetch('/start-services', { method: 'POST' })
    const data = await res.json()
    updateServiceStatus(data)
    if (data.errors && data.errors.length > 0) {
      document.getElementById('service-errors').textContent = data.errors.join('\n')
      document.getElementById('service-errors').style.display = 'block'
    }
    if (data.ollama) loadOllamaModels()
  } catch (e) {
    document.getElementById('service-errors').textContent = 'Falha ao comunicar com servidor: ' + e
    document.getElementById('service-errors').style.display = 'block'
  }
  btn.disabled = false
  btn.textContent = 'Iniciar Serviços'
}

function updateServiceStatus(data) {
  const ollamaEl = document.getElementById('svc-ollama')
  const gatewayEl = document.getElementById('svc-gateway')
  ollamaEl.textContent = data.ollama ? 'OK' : 'OFF'
  ollamaEl.className = 'svc-status ' + (data.ollama ? 'ok' : 'error')
  gatewayEl.textContent = data.gateway ? 'OK' : 'OFF'
  gatewayEl.className = 'svc-status ' + (data.gateway ? 'ok' : 'error')
}
</script>
</body>
</html>`

const COLORS = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  CYAN: "\x1b[36m",
}

function logo() {
  return `
${COLORS.YELLOW}${COLORS.BOLD}   ▲   ${COLORS.RESET}
${COLORS.RED}${COLORS.BOLD}  ╱ ╲  ${COLORS.RESET}
${COLORS.RED}${COLORS.BOLD} ╱   ╲ ${COLORS.RESET} ${COLORS.BOLD}ARGENTA INCEPTION${COLORS.RESET}
${COLORS.RED}${COLORS.BOLD}╱_____╲${COLORS.RESET}
`
}

let oauthSession: { deviceCode: string; accessToken?: string; refreshToken?: string } | null = null

async function main() {
  const url = `http://localhost:${PORT}`

  let resolveExit: () => void
  const exitSignal = new Promise<void>((r) => (resolveExit = r))

  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const pathname = new URL(req.url).pathname

      if (req.method === "GET" && pathname === "/") {
        return new Response(WIZARD_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })
      }

      if (req.method === "GET" && pathname === "/health") {
        const health = await checkServices()
        return new Response(JSON.stringify(health), { headers: { "Content-Type": "application/json" } })
      }

      if (req.method === "POST" && pathname === "/start-services") {
        const result = await startLocalServices()
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } })
      }

      if (req.method === "GET" && pathname === "/ollama-models") {
        const models = await getOllamaModels()
        return new Response(JSON.stringify(models), { headers: { "Content-Type": "application/json" } })
      }

      if (req.method === "GET" && pathname === "/oauth-chatgpt") {
        try {
          const data = await startChatGPTOAuth()
          oauthSession = { deviceCode: data.device_code }
          return new Response(
            JSON.stringify({ user_code: data.user_code, verification_uri: data.verification_uri }),
            { headers: { "Content-Type": "application/json" } }
          )
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
        }
      }

      if (req.method === "GET" && pathname.startsWith("/oauth-poll")) {
        const code = new URL(req.url).searchParams.get("code")
        if (!code || !oauthSession) {
          return new Response(JSON.stringify({ error: "No session" }), { status: 400 })
        }
        try {
          const token = await pollChatGPTToken(code)
          oauthSession.accessToken = token.access_token
          oauthSession.refreshToken = token.refresh_token
          return new Response(JSON.stringify({ ok: true, access_token: token.access_token, refresh_token: token.refresh_token }), { headers: { "Content-Type": "application/json" } })
        } catch {
          return new Response(JSON.stringify({ pending: true }), { headers: { "Content-Type": "application/json" } })
        }
      }

      if (req.method === "POST" && pathname === "/save") {
        try {
          const payload = (await req.json()) as Parameters<typeof saveProvider>[0] & { oauthToken?: string; refreshToken?: string; ollamaModel?: string }
          if (payload.oauthToken && oauthSession) {
            payload.oauthToken = oauthSession.accessToken
            payload.refreshToken = oauthSession.refreshToken
          }
          await saveProvider(payload)
          setTimeout(() => resolveExit(), 800)
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          return new Response(JSON.stringify({ ok: false, error: msg }), { status: 400 })
        }
      }

      return new Response("Not Found", { status: 404 })
    },
    error(e) {
      console.error(COLORS.RED + COLORS.BOLD + "Erro no servidor: " + COLORS.RESET + e.message)
    },
  })

  console.log("")
  console.log(logo())
  console.log("")
  console.log(COLORS.CYAN + COLORS.BOLD + "  Setup Wizard:    " + COLORS.RESET + url)
  console.log("")

  open(url).catch(() => {
    console.log(COLORS.YELLOW + "  Não foi possível abrir browser." + COLORS.RESET)
    console.log("  Acesse: " + url)
  })

  await exitSignal
  server.stop(true)
  console.log("")
  console.log(COLORS.GREEN + COLORS.BOLD + "  Configuração salva." + COLORS.RESET)
  console.log("  Execute " + COLORS.BOLD + "argenta" + COLORS.RESET + " para iniciar.")
  console.log("")
}

main().catch((err) => {
  console.error(COLORS.RED + "Erro fatal:" + COLORS.RESET, err)
  process.exit(1)
})