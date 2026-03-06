# Monitor de Paginas Web - Aiko Digital

Dashboard web para **monitorar disponibilidade** e **tempo de resposta** de uma lista de sistemas (URLs), com importação por Excel/CSV, auto-refresh e modo “Painel TV”.

### Versão de Desktop
![Desktop](https://i.ibb.co/jkhS2Dty/image.png)

### Versão Mobile
![Mobile](https://i.ibb.co/3Yph7H6L/image.png)

### Versão de TV
![TV](https://i.ibb.co/5gVMJHQH/image.png)

## Como o projeto funciona (visão geral)

O projeto tem 4 camadas principais:

- **UI (React/Next.js)**: componentes do dashboard renderizam tabelas, cards e gráficos.
- **Orquestração/Estado (hook)**: `hooks/use-monitor.ts` é a “cola” que carrega sites, dispara verificações e atualiza a UI.
- **Persistência local (localStorage)**: `lib/monitor-store.ts` salva/restaura a lista e o histórico de checks no browser.
- **Checagem de URL (built-in)**: `lib/check-url.ts` implementa a lógica de checagem (DNS, HTTP request, timeout). `app/api/check-site/route.ts` usa essa lógica e retorna `SiteCheck` para o dashboard.

## Pré-requisitos

- **Node.js** (recomendado LTS)
- **NPM** (ou yarn/pnpm)

Não é necessário nenhum serviço externo — a checagem roda dentro do Next.js.

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
- **3) API Route**: `POST /api/check-site` recebe `{ url }` e chama `lib/check-url.ts` internamente.
- **4) Mapeamento**: a rota converte o resultado para:
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
  - **`app/api/check-site/route.ts`**: rota que chama `lib/check-url.ts` e retorna `SiteCheck`.
  - **`app/api/check/route.ts`**: rota GET `?url=...` que retorna o formato completo (compatível com a API original).
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
  - **`check-url.ts`**: lógica de checagem (DNS, HTTP com axios, timeout 8s, HTTPS sem validação de certificado).
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

- Verifique se as URLs estão corretas e acessíveis (DNS, firewall, etc.).
- Ligue os logs (seção acima) e compare:
  - **Client**: request para `/api/check-site` e JSON recebido
  - **Server**: erros em `app/api/check-site/route.ts` ou `lib/check-url.ts`
