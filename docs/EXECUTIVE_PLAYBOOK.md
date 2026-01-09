# Executive Playbook (Quick Start)

## Identity
- Configure OIDC/SAML in the `auth-service` (see `backend/auth-service/README.md`).

## Infrastructure
- cd `infrastructure/terraform`
- terraform init -backend-config=prod.hcl
- terraform apply -var-file=enterprise.tfvars

## K8s bootstrapping
- helm upgrade --install dukat-voice ./kubernetes/helm --namespace voice-system

## Global Connectivity
- Anycast IP: use AWS Global Accelerator + Route53 latency-based routing.
- Edge VAD: Cloudflare Workers analyze signal energy; upgrade to WebSocket -> gRPC tunnel to EKS.

## Secrets
- Push credentials to AWS Secrets Manager / Vault. Use ExternalSecrets to inject into K8s.

## Verification & Auditing
- SOC2 helper: `sre/soc2_audit.sh`
- Performance tests: `k6 run sre/k6/voice-performance.js --vus 100 --duration 10m`

---

For details, see `/docs/ARCHITECTURE.md` and service runbooks in `/docs/runbooks`.