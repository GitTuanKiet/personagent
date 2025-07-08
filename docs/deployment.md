# PersonAgent - Docker Deployment Guide

## 🐳 Container Architecture Overview

PersonAgent được triển khai với **4 container** theo docker-compose.yaml:

```
┌─────────────────────────────────────────────────────────┐
│                    PersonAgent Stack                    │
├─────────────────────────────────────────────────────────┤
│  web:3000        │  agent:8123      │  db:5433         │
│  Next.js         │  LangGraph API   │  PostgreSQL      │
│  Frontend        │  AI Agent        │  Database        │
├─────────────────────────────────────────────────────────┤
│                  redis:6380                             │
│                  Redis Cache                            │
└─────────────────────────────────────────────────────────┘
```

### Service Dependencies
```yaml
# Service startup order với health checks:
1. redis (Cache layer)        ✓ Health: redis-cli ping
2. db (PostgreSQL)           ✓ Health: pg_isready 
3. agent (LangGraph API)     ✓ Depends: redis + db
4. web (Next.js Frontend)    ✓ Depends: agent
```

---

## 📋 Environment Variables Required

Dựa trên docker-compose.yaml:
```bash
# .env file tại root directory:
POSTGRES_PASSWORD=your_postgres_password
LANGSMITH_API_KEY=your_langsmith_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## 🚀 Quick Start Deployment

### Sử dụng Docker Compose
```bash
# Clone repository
git clone <repository-url>
cd personagent

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Sử dụng Makefile Commands
```bash
# Development commands có sẵn:
make dev-web    # Starts the web development server (Next.js)
make dev-agent  # Starts the agent development server (LangGraph)
make dev        # Starts both web and agent development servers
```

---

## 🏗️ Docker Compose Configuration

### File docker-compose.yaml thực tế:

```yaml
volumes:
  pg-data:
    driver: local

services:
  redis:
    image: redis:8.2-m01-alpine
    container_name: redis
    ports:
      - "6380:6379"
    healthcheck:
      test: redis-cli ping
      interval: 5s
      timeout: 1s
      retries: 5

  db:
    image: postgres:17.5-alpine
    container_name: db
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: pg_isready -U postgres
      start_period: 10s
      timeout: 1s
      retries: 5
      interval: 5s

  agent:
    build:
      context: apps/agent
      dockerfile: Dockerfile
    container_name: agent
    ports:
      - "8123:8000"
    depends_on:
      redis:
        condition: service_healthy
      db:
        condition: service_healthy
    environment:
      CONTAINER_NAME: agent
      LANGSMITH_API_KEY: ${LANGSMITH_API_KEY}
      REDIS_URI: redis://redis:6379
      DATABASE_URI: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/postgres?sslmode=disable
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: web
    ports:
      - "3000:3000"
    depends_on:
      agent:
        condition: service_healthy
    environment:
      AGENT_URL: http://agent:8000
      DATABASE_URI: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/postgres?sslmode=disable
      LANGCHAIN_API_KEY: ${LANGSMITH_API_KEY}
      LANGGRAPH_API_URL: http://agent:8000
```

---

## 🔧 Agent Service Dockerfile

File `apps/agent/Dockerfile` thực tế:

```dockerfile
FROM langchain/langgraphjs-api:20
ADD . /deps/agent
ENV LANGSERVE_GRAPHS='{"agent":"./dist/bua/graph.js:graph"}'
WORKDIR /deps/agent
RUN npm i --omit=dev
RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts

RUN apt-get update \
    && apt-get install -y procps wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 zstd \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN npx -y patchright-core install-deps chrome

ADD ./src/browser/dom/buildDomTree.js /home/tuankiet/code/personagent/apps/agent/src/browser/dom/buildDomTree.js
```

**Key features:**
- **Base image**: langchain/langgraphjs-api:20
- **LangGraph integration**: Serves agent graph tại "./dist/bua/graph.js:graph"
- **Chrome installation**: Google Chrome stable với fonts
- **Patchright setup**: Browser automation dependencies
- **DOM processing**: Custom buildDomTree.js script

---

## 📁 Build Optimization

### .dockerignore file:
```
*Dockerfile*
*docker-compose*
.dockerignore
node_modules
npm-debug.log
.next
.git
.github
*.md
.env.example
```

---

## 🔄 Development Workflow

### Package.json Scripts (Root):
```json
{
  "scripts": {
    "build": "turbo run build",
    "clean": "turbo run clean --parallel",
    "format": "turbo run format && bun scripts/format.mjs",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types"
  }
}
```

### Makefile Commands:
```makefile
dev-web:
	@echo "Starting frontend development server..."
	@cd apps/web && bun run dev

dev-agent:
	@echo "Starting backend development server..."
	@cd apps/agent && bunx @langchain/langgraph-cli@latest dev

dev:
	@echo "Starting both web and agent development servers..."
	@make dev-web & make dev-agent 
```

---

## 🔍 Service Verification

### Health Check Endpoints:
```bash
# Redis
curl http://localhost:6380/ping

# PostgreSQL (connection test)
docker exec -it db pg_isready -U postgres

# Agent API
curl http://localhost:8123/health

# Web UI
curl http://localhost:3000
```

---

## 🚨 Troubleshooting

### Common Commands:
```bash
# Check container status
docker-compose ps

# View service logs
docker-compose logs redis
docker-compose logs db
docker-compose logs agent
docker-compose logs web

# Restart specific service
docker-compose restart agent
docker-compose restart web

# Full restart
docker-compose down
docker-compose up -d

# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Agent Service Issues:
```bash
# Check Chrome installation
docker exec -it agent google-chrome --version

# Check Patchright
docker exec -it agent npx patchright-core --version

# Check Node.js environment
docker exec -it agent npm list
```

---

## 📊 Resource Usage

### Container Port Mapping:
- **Web Frontend**: localhost:3000 → container:3000
- **Agent API**: localhost:8123 → container:8000  
- **PostgreSQL**: localhost:5433 → container:5432
- **Redis**: localhost:6380 → container:6379

### Data Persistence:
- **PostgreSQL**: Volume `pg-data` mounted tại `/var/lib/postgresql/data`
- **Redis**: No persistent volume configured (in-memory only)

---

PersonAgent sử dụng **standard Docker Compose setup** với LangGraph API backend, Next.js frontend, PostgreSQL database và Redis cache cho AI-powered UX testing automation.
