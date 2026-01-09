# Dukat Consolidated (Enterprise Voice AI SaaS)

This repository is a consolidation of `dukat-voice-saas` and `vigilant-raccoon-bounce` aimed at producing a Fortune-500-grade, regulated-industry-ready Voice AI SaaS codebase.

Structure:
- /agent — real-time orchestrator, memory layer, agent core
- /backend — microservices (auth, billing, telephony, analytics)
- /infrastructure — terraform modules & k8s manifests (Istio, ExternalSecrets, ArgoCD)
- /frontend — marketing site and admin portals
- /sre — performance and compliance scripts (k6, SOC2 helpers)
- /docs — architecture and runbooks

Quickstart (local dev):
- Use the infra playbook in `/docs/EXECUTIVE_PLAYBOOK.md` to bootstrap resources.

This is the initial consolidation checkpoint — many services are stubs or copies of originals; next steps add tests, integrate CI for deployments, and complete missing modules (external secrets, model registry, production TTS/ASR wiring).