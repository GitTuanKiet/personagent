.PHONY: help dev-web dev-agent dev

help:
	@echo "Available commands:"
	@echo "  make dev-web    - Starts the web development server (Next.js)"
	@echo "  make dev-agent  - Starts the agent development server (LangGraph)"
	@echo "  make dev        - Starts both web and agent development servers"

dev-web:
	@echo "Starting frontend development server..."
	@cd apps/web && bun run dev

dev-agent:
	@echo "Starting backend development server..."
	@cd apps/agent && bun run dev

# Run web and agent concurrently
dev:
	@echo "Starting both web and agent development servers..."
	@make dev-web & make dev-agent 