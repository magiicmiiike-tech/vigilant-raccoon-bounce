# Setup & Deployment Quickstart

## Prerequisites
- AWS account with permissions to provision VPC/EKS/Terraform resources
- An S3 bucket for terraform state
- K8s cluster created by Terraform
- ArgoCD installed in the cluster
- ExternalSecrets operator installed in the cluster

## Steps
1. Configure secrets (Vault/Secrets Manager) and add entries for services.
2. terraform init && terraform apply -var-file=enterprise.tfvars
3. Install Istio and configure mTLS (apply `infrastructure/kubernetes/istio/peer-authentication-mtls.yaml`)
4. Install ExternalSecrets and create `external-secret-auth.yaml` for auth-service
5. Use ArgoCD to sync `infrastructure/kubernetes/argocd/auth-service-application.yaml`
6. Run smoke tests: `sre/k6/voice-performance.js` with k6

## Developer Local
- For local dev of the frontend: cd `frontend/marketing`; pnpm install && pnpm dev
- For local tests: pip install -r requirements-dev.txt; pytest

## Troubleshooting
- If secrets are not present, pods will crash due to missing env vars. Verify ExternalSecrets logs.
- For debugging network issues, inspect istio-proxy logs and ArgoCD app sync status.