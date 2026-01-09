# Secrets Module

This module should provision a secrets backend (AWS Secrets Manager / HashiCorp Vault) and configure ExternalSecrets to pull values into Kubernetes.

Example usage:
- Store secrets under `/dukat/prod/<service>/<key>` in Secrets Manager.
- Use ExternalSecrets CRs (see `infrastructure/kubernetes/external-secrets`) to map to K8s secrets.

Security: Never store raw secrets in Terraform state; use `sops`/KMS to encrypt any values stored in git.