# Architecture Diagram (ASCII)

```
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

## Explanation
- Flows: Inbound call (PSTN/WebRTC) --> Edge VAD/ASR (partial stream) --> Orchestrator (agent routing) --> LLM/TTS (token stream back) --> Outbound audio.
- Latency Budget: enforced per-stage with timeouts and fallbacks (measured via OTEL spans).
- Failures: LLM outages fallback to deterministic FSM; region failure uses Route53 failover and Kafka CDC for sync.
