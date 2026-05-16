.PHONY: dev build lint db-up db-down db-migrate db-seed admin-hash

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

db-up:
	docker-compose up -d

db-down:
	docker-compose down

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

admin-hash:
	npm run admin:hash $(password)
