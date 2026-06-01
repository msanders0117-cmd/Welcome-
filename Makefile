.PHONY: dev build test db-migrate help

help:
	@echo "Available commands:"
	@echo "  dev        - Start local development environment"
	@echo "  build      - Build all docker images"
	@echo "  test       - Run tests for all services"
	@echo "  db-migrate - Run database migrations"

dev:
	docker-compose up

build:
	docker-compose build

test:
	npm test

db-migrate:
	npm run db:migrate --workspace backend-api
