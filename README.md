# forest-operations-monitor

Dashboard web para **monitorar disponibilidade** e **tempo de resposta** de uma lista de sistemas (URLs), com importação por Excel/CSV, auto-refresh e modo “Painel TV”.

## Como o projeto funciona (visão geral)

O projeto tem 4 camadas principais:

- **UI (React/Next.js)**: componentes do dashboard renderizam tabelas, cards e gráficos.
- **Orquestração/Estado (hook)**: `hooks/use-monitor.ts` é a “cola” que carrega sites, dispara verificações e atualiza a UI.
- **Persistência local (localStorage)**: `lib/monitor-store.ts` salva/restaura a lista e o histórico de checks no browser.
- **Integração com o serviço de checagem (proxy)**: `app/api/check-site/route.ts` recebe `url` e chama o serviço externo em `http://localhost:3001/check?url=...`, convertendo a resposta para o formato interno (`SiteCheck`).

## Pré-requisitos

- **Node.js** (recomendado LTS)
- **NPM** (ou yarn/pnpm)
- Um serviço externo de checagem rodando em `http://localhost:3001` com o endpoint:
  - `GET /check?url=<URL>` retornando algo como:

```json
{
  "request": { "url": "https://google.com", "method": "GET" },
  "response": {
    "online": true,
    "httpStatus": 200,
    "statusText": "OK",
    "finalUrl": "https://www.google.com/",
    "redirects": 1,
    "responseTimeMs": "480.87"
  }
}
```

## Rodando localmente

Instale dependências e suba o Next:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Arquitetura e fluxo de dados

### Fluxo principal (do clique até o status na UI)

- **1) UI**: `components/monitor/header.tsx` chama `onRefresh`.
- **2) Hook**: `useMonitor().checkAllSites()` marca todos como `checking` e dispara checagens em paralelo.
- **3) Proxy (Next API Route)**: `POST /api/check-site` recebe `{ url }` e chama:
  - `http://localhost:3001/check?url=<encodeURIComponent(url)>`
- **4) Mapeamento**: o proxy converte o formato externo para:
  - `SiteCheck = { status, httpCode, responseTime, timestamp }`
- **5) UI atualiza**: `lib/monitor-store.ts` aplica `updateSiteCheck()` e mantém um histórico curto (últimos 10) para gráficos.

### Regras de status (normalização)

O status exibido na UI é derivado de `response.online`, `response.httpStatus` e `response.responseTimeMs`:

- **offline**: `online === false` ou `httpStatus >= 500`
- **unstable**: `400 <= httpStatus < 500` ou `responseTimeMs > 5000`
- **online**: caso contrário

## Estrutura de pastas (o que fica onde)

- **`app/`**
  - **`app/page.tsx`**: entrada do app (renderiza `<Dashboard />`).
  - **`app/layout.tsx`**: layout global (providers, estilos, etc.).
  - **`app/api/check-site/route.ts`**: rota backend do Next que funciona como **proxy** do serviço em `localhost:3001`.
- **`components/monitor/`** (UI do monitor)
  - **`dashboard.tsx`**: orquestra a tela principal e alterna para o modo Painel TV.
  - **`header.tsx`**: ações (refresh, export CSV, importar, modo TV).
  - **`stats-cards.tsx`**: cartões de totais (online/offline/alertas/tempo médio).
  - **`charts.tsx`**: gráficos (pizza de disponibilidade, barras de tempo, tendência).
  - **`sites-table.tsx`**: tabela com filtros, ordenação e paginação.
  - **`upload-modal.tsx`**: importação de Excel/CSV via `xlsx`.
  - **`operations-panel.tsx`**: modo “Painel TV” para exibição em tela grande.
  - **`empty-state.tsx`**: tela inicial quando não há sites.
- **`components/ui/`**
  - Componentes de UI reutilizáveis (botões, inputs, diálogo, etc.).
- **`hooks/`**
  - **`use-monitor.ts`**: lógica principal de monitoramento (estado, timers, checagem em lote).
- **`lib/`**
  - **`types.ts`**: tipos compartilhados (`MonitoredSite`, `SiteCheck`, etc.).
  - **`monitor-store.ts`**: persistência/localStorage + estatísticas + export CSV.
  - **`default-sites.ts`**: lista inicial (seed) para primeira execução.
  - **`logger.ts`**: logger com liga/desliga por variável de ambiente.

## Logs: onde ver, como ligar e como desativar

### Onde aparecem

- **Logs do navegador (client)**: aparecem no **Console** do DevTools.
  - Origem principal: `hooks/use-monitor.ts`
- **Logs do servidor Next (server)**: aparecem no terminal onde você roda `npm run dev`.
  - Origem principal: `app/api/check-site/route.ts`

### Como ligar logs

Crie/edite o arquivo `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_MONITOR_DEBUG_LOGS=1
MONITOR_DEBUG_LOGS=1
```

Depois **reinicie** o `npm run dev`.

### Como desativar logs

- Remova essas variáveis do `.env.local`, ou
- defina como `0` / `false`, e reinicie o `npm run dev`.

## Dicas de troubleshooting (quando “tudo fica offline”)

- Verifique se o serviço de checagem está realmente acessível em `http://localhost:3001/check?url=...`.
- Ligue os logs (seção acima) e compare:
  - **Client**: request para `/api/check-site` e JSON recebido
  - **Server**: resposta bruta do serviço externo (inclui `rawText`)

## Sobre o v0

Este projeto foi iniciado via [v0](https://v0.app). Link do projeto v0:
`https://v0.app/chat/projects/prj_aICOMDGjiGwfqLLceQgySASTu9jh`
