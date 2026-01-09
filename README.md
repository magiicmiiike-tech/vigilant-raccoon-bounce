# Dukat Voice AI SaaS

This project is an enterprise-grade multi-tenant Voice AI SaaS platform.

## Architecture

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

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| LiveKit Server | 7880/7881 | http://localhost:7881 |
| Auth Service | 3010 | http://localhost:3010 |
| Telephony Service | 3012 | http://localhost:3012 |

## Development

See `GEMINI.md` for detailed context and development workflows.
