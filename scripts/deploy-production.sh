#!/usr/bin/env bash
set -euo pipefail

: "${K8S_NAMESPACE:?K8S_NAMESPACE is required}"
: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"

kubectl apply -n "$K8S_NAMESPACE" -f infra/k8s/configmap.yaml
kubectl apply -n "$K8S_NAMESPACE" -f infra/k8s/backend-deployment.yaml
kubectl apply -n "$K8S_NAMESPACE" -f infra/k8s/frontend-deployment.yaml
kubectl apply -n "$K8S_NAMESPACE" -f infra/k8s/services.yaml
kubectl apply -n "$K8S_NAMESPACE" -f infra/k8s/ingress.yaml

kubectl -n "$K8S_NAMESPACE" set image deployment/emissions-backend backend="$BACKEND_IMAGE"
kubectl -n "$K8S_NAMESPACE" set image deployment/emissions-frontend frontend="$FRONTEND_IMAGE"

kubectl -n "$K8S_NAMESPACE" rollout status deployment/emissions-backend --timeout=300s
kubectl -n "$K8S_NAMESPACE" rollout status deployment/emissions-frontend --timeout=300s
