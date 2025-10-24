.PHONY: help run build test clean migrate-up migrate-down docker-up docker-down

help:
	@grep -E '^[a-zA-Z_-]+:.*

run:
	go run cmd/api/main.go

build:
	go build -o bin/api cmd/api/main.go

test:
	go test -v -cover ./...

clean:
	rm -rf bin/
	rm -rf uploads/

lint:
	golangci-lint run

migrate-up:
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/physics_collab?sslmode=disable" up

migrate-down:
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/physics_collab?sslmode=disable" down

migrate-create:
	migrate create -ext sql -dir migrations -seq $(name)

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	docker-compose down
	docker-compose up -d --build
