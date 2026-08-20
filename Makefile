.PHONY: setup train-ml test dev-backend dev-frontend docker-up docker-down clean

setup:
	@echo "Installing backend dependencies..."
	pip install -r backend/requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

train-ml:
	@echo "Generating synthetic UPI scenario data & training XGBoost..."
	python ml/training/train_xgb.py

test:
	@echo "Running backend test suite..."
	python -m pytest backend/tests -v

dev-backend:
	@echo "Starting FastAPI backend server on http://localhost:8000..."
	uvicorn app.main:app --app-dir backend --reload --port 8000

dev-frontend:
	@echo "Starting Vite frontend dev server on http://localhost:5173..."
	cd frontend && npm run dev

docker-up:
	@echo "Starting full multi-container stack (Postgres, Backend, Frontend, Prometheus, Grafana)..."
	docker compose up --build

docker-down:
	@echo "Stopping docker stack..."
	docker compose down

clean:
	@echo "Cleaning cache files..."
	rm -rf .pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
