# Dukat Consolidation Plan

Source: Consolidation of `dukat-voice-saas` + `vigilant-raccoon-bounce` copies.

Goals:
- Create an enterprise-grade, Fortune-500-ready Voice AI SaaS codebase.
- Merge best agent, infra, frontend, telephony and compliance modules into one canonical monorepo.
- Provide infra stubs, SRE playbooks, SOC2 audit helpers, performance test harness, and marketing site.

Immediate Steps:
1. Copy high-priority agent components (realtime orchestrator, memory, agent core).
2. Import frontend (Next/Payload) into `/frontend/marketing` and unify scripts.
3. Consolidate `infrastructure/terraform` modules and add ExternalSecrets + Istio mTLS sample.
4. Add SRE scripts: k6 perf test skeleton and SOC2 audit helper script.
5. Add deployment and runbook docs under `/docs`.

Next actions: implement step 1 (agent files) and add tests + CI skeleton.