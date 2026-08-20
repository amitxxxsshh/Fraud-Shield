#!/usr/bin/env bash
# Production Deployment Automation Script for AWS ECS & RDS
set -euo pipefail

AWS_REGION="ap-south-1"
ECR_BACKEND_REPO="fraud-shield-backend"
ECS_CLUSTER="fraud-shield-cluster"
ECS_SERVICE="fraud-shield-service"

echo "=== 1. Building Docker Backend Image ==="
docker build -t "${ECR_BACKEND_REPO}:latest" -f infra/docker/Dockerfile.backend .

echo "=== 2. Authenticating with AWS ECR ==="
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com"

ECR_URI="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest"

echo "=== 3. Tagging & Pushing Image to ECR ==="
docker tag "${ECR_BACKEND_REPO}:latest" "${ECR_URI}"
docker push "${ECR_URI}"

echo "=== 4. Updating ECS Service Deployment ==="
aws ecs update-service \
  --cluster "${ECS_CLUSTER}" \
  --service "${ECS_SERVICE}" \
  --force-new-deployment \
  --region "${AWS_REGION}"

echo "=== 5. Deployment Initiated Successfully ==="
