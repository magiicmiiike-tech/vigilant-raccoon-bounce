# Dukat Voice AI SaaS

## SECTION 1 — HIGH-LEVEL SYSTEM OVERVIEW

### Architecture Diagram

The system is a multi-tenant Voice AI SaaS with hybrid edge-cloud deployment for
<500ms latency, multi-agent orchestration for complex tasks (e.g., healthcare
triage), and full enterprise safeguards (governance, compliance,
sustainability). Core: K8s clusters in 3 regions (us-east-1, eu-west-1,
ap-southeast-1) with active/active replication, Route53 for global routing.
Edge for VAD/ASR (Cloudflare Workers/AWS Wavelength), cloud for LLM/TTS (EKS
with GPU autoscaling). Data: Postgres (transactional) + Delta Lakehouse
(analytics) + Qdrant (vectors). Security: mTLS everywhere, zero-trust with
Istio, AI guardrails. Observability: OTEL + Prometheus + Grafana. Scaling:
HPA/VPA/Keda, blue/green for agents.

```text
[Global User/Callee] --> [Route53 (Latency/Geo Routing)] --> [Regional Ingress (NGINX/Istio)]
  |
  v
[Edge Compute (CF Workers/Wavelength)]: Neural VAD + Partial ASR (Silero + Faster-Whisper) --> WebRTC/gRPC Stream
  | (Interrupt Arbitration, <50ms budget)
  v
[Core Orchestrator (Node.js/Express)]: Multi-Agent FSM (Intent Agent --> RAG Agent --> Response Agent)
  | (Deterministic State Machines, Semantic Cache (GPTCache), Token Streaming)
  | (AI Safety: Prompt Firewall, Tool Allowlists, Response Validation, Confidence Scoring)
  v
[LLM Backend (Python/FastAPI)]: Model Tiering (GPT-4o-mini/simple, GPT-4o/complex) + TTS (ElevenLabs Token-by-Token)
  | (Cost Control: Token Budgeting, Per-Tenant Caps, Kill-Switches)
  v
[Data Layer]: Postgres (Tenants/Users) + Delta Lake (Analytics/Usage) + Qdrant (Memory/Vectors)
  | (Memory Decay, Replayable Conversations)
  v
[Ops Layer]: Terraform (IaC) + ArgoCD (CI/CD) + Chaos Mesh (Failure Injection) + Cloud Carbon Footprint (Sustainability)
  | (Global Compliance: Regional Residency, Audit Exports)
  v
[Human Escalation]: HITL Webhook (Twilio SIP Transfer) + Shadow Traffic for Testing
```

### Request/Response Flows

1. **Inbound Voice Flow**:
   - Client dials number --> SBC (Kamailio) routes to regional edge --> Neural
     VAD detects intent --> Partial ASR streams text --> Orchestrator routes to
     Intent Agent --> RAG retrieval (semantic cache check) --> Response Agent
     generates --> Token TTS streams back --> Client hears response.
2. **API Request Flow** (e.g., /api/voice/call):
   - Auth (JWT + mTLS) --> Tenant isolation (RLS) --> Rate limit (per-tenant)
     --> Proxy to service --> Response validation --> Log/trace.
3. **Escalation Flow**:
   - Confidence <0.85 or policy violation --> Escalate to human (SIP transfer)
     --> Record feedback for retraining.

### Latency Budget Per Component (ms)

| Component             | Target | Fallback        |
| --------------------- | ------ | --------------- |
| Neural VAD            | <40    | Silence fill    |
| Partial ASR           | <80    | Text mode       |
| Orchestration/Routing | <50    | Rule-based      |
| LLM Inference         | <200   | Cached response |
| Token TTS             | <100   | Pre-recorded    |
| Network/Total         | <500   | HITL escalate   |

### Failure Scenarios Overview

- **Partial Outage**: Circuit breaker isolates failed services (e.g., LLM down
  --> use cached/fallback agent).
- **High Load**: HPA scales pods on CPU>70%, Keda on queue length>100.
- **Security Breach**: Guardrails block, red-team detects (daily CI),
  kill-switch on anomalies.
- **Compliance Violation**: Policy engine enforces (e.g., no PII in EU region),
  auto-audit exports.

## Core Architecture

- **API Gateway**: Entry point, handles routing and high-level validation.
- **Auth Service**: Manages users, roles, and sessions.
- **Tenant Service**: Manages tenant configurations and provisioning.
- **Telephony Service**: Integrates with LiveKit, SIP, and PSTN gateways.
- **Voice Agent**: Python-based AI agent (STT -> LLM -> TTS).
- **RAG System**: Vector-based knowledge retrieval.

## Project Structure

- `frontend/`: User portals and dashboards (Next.js).
- `backend/`: Node.js microservices.
- `agent/`: Python AI voice agent.
- `telephony/`: SBC, PSTN, and compliance configurations.
- `infrastructure/`: Terraform and Ansible code.
- `ml-models/`: Custom AI models.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ & pnpm
- Python 3.9+

### Running the Infrastructure

```bash
cd docker
docker-compose up -d
```

### Services Overview

| Service           | Port      | URL                       |
| ----------------- | --------- | ------------------------- |
| API Gateway       | 3000      | <http://localhost:3000>   |
| LiveKit Server    | 7880/7881 | <http://localhost:7881>   |
| Auth Service      | 3010      | <http://localhost:3010>   |
| Telephony Service | 3012      | <http://localhost:3012>   |

## Development

See `GEMINI.md` for detailed context and development workflows.