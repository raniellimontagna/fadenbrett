# Fadenbrett

**Siga o roter Faden. Conecte as pistas.**

Quadro de investigação digital interativo, self-hosted e open-source. Inspirado nos painéis de detetive de filmes e séries — conecte personagens, eventos e teorias com fios vermelhos num canvas infinito.

> *Fadenbrett* vem do alemão: **Faden** (fio) + **Brett** (quadro). O nome referencia o *roter Faden* (fio condutor) e os fios vermelhos dos quadros de investigação de séries como Dark.

![License](https://img.shields.io/badge/license-MIT-blue)
![CI](https://img.shields.io/github/actions/workflow/status/raniellimontagna/fadenbrett/ci.yml?label=CI)

---

## Features

- **Canvas infinito** com cards de personagens, post-its e conexões semânticas
- **Colaboração em tempo real** via WebSockets (cursores remotos, sincronização de estado)
- **Múltiplos boards** com troca instantânea
- **Upload de imagens** para cards (armazenadas no servidor)
- **Filtros, busca e timeline** para navegação por era/período
- **Modo apresentação** com slides por nó
- **Undo/Redo** ilimitado
- **Exportação** PNG/JPEG do canvas
- **Self-hosted** — seus dados ficam no seu servidor, sem telemetria

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 + Zustand + React Flow |
| Backend | Fastify + Drizzle ORM + SQLite (better-sqlite3) |
| Infra | Docker + Nginx + Compose |

---

## Deploy rápido

### Pré-requisitos

- Docker 24+ e Docker Compose v2

### Iniciar

```bash
git clone https://github.com/raniellimontagna/fadenbrett.git
cd fadenbrett/deploy
cp .env.example .env   # ajuste PORT se necessário
docker compose up -d
```

Acesse **http://localhost** no navegador.

### Arquitetura

```
Browser
  └─► Nginx :80 (web)
        ├─ /api/*     → API :3001
        ├─ /ws/*      → API :3001  (WebSocket)
        ├─ /uploads/* → API :3001  (arquivos estáticos)
        └─ /*         → SPA (Vite build)
```

Os dados (SQLite + uploads) ficam em volume Docker nomeado e persistem entre reinicializações.

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `80` | Porta exposta pelo Nginx |

---

## Instalação no Proxmox VE

Cole no shell do Proxmox:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/raniellimontagna/fadenbrett/main/scripts/proxmox/install.sh)
```

Parâmetros opcionais (via variáveis de ambiente antes do pipe):

```bash
CT_ID=200 CT_RAM=1024 FADENBRETT_PORT=8080 bash <(curl -fsSL ...)
```

Para atualizar:

```bash
CT_ID=200 bash <(curl -fsSL https://raw.githubusercontent.com/raniellimontagna/fadenbrett/main/scripts/proxmox/update.sh)
```

---

## Desenvolvimento local

```bash
# Clone
git clone https://github.com/raniellimontagna/fadenbrett.git
cd fadenbrett

# Instale as dependências
pnpm install

# Inicie o backend (porta 3001)
pnpm --filter @fadenbrett/api dev

# Inicie o frontend (porta 5173) em outro terminal
pnpm --filter @fadenbrett/web dev
```

O frontend usa `VITE_API_URL=http://localhost:3001` por padrão.

### Qualidade

```bash
pnpm type-check   # TypeScript
pnpm lint         # ESLint
pnpm test         # Vitest (integração API)
```

---

## Licença

MIT — veja [LICENSE](LICENSE).
