# Dukat Voice AI SaaS - Project Context

## Project Overview

**Dukat Voice AI SaaS** is an enterprise-grade, multi-tenant platform for building and managing AI-powered voice agents. It uses a microservices architecture, sophisticated telephony integration, and real-time AI processing.

## Architecture & Structure

The project follows a domain-driven, monorepo structure:

### **1. Frontend (`frontend/`)**

* **User Portal:** Main interface for customers (`frontend/user-portal`).
* **Admin Dashboard:** For tenant administrators (`frontend/admin-dashboard`).
* **Super Admin:** Platform management (`frontend/super-admin`).
* **Mobile:** iOS and Android SDKs/Apps (`frontend/mobile`).

### **2. Backend Services (`backend/`)**

* **API Gateway:** Entry point (`backend/api-gateway`).
* **Auth Service:** Identity & Access Management (`backend/auth-service`).
* **Tenant Service:** Tenant configuration & isolation (`backend/tenant-service`).
* **Telephony Service:** (Formerly Voice Service) Manages LiveKit, SIP, and PSTN (`backend/telephony-service`).
* **Billing, Analytics, Webhook, Integration, Notification, Emergency Services.**

### **3. AI & Voice (`agent/` & `ml-models/`)**

* **Agent:** Python-based voice agent logic (`agent/`).
* **ML Models:** Custom trained models for voice cloning, ASR, and intent classification (`ml-models/`).
* **Audio Processing:** DSP pipelines for noise suppression and echo cancellation (`audio-processing/`).

### **4. Telephony Infrastructure (`telephony/`)**

* **SBC:** Kamailio/OpenSIPS configurations (`telephony/sbc`).
* **PSTN:** Carrier integrations (Twilio, Bandwidth) (`telephony/pstn-gateways`).
* **Emergency:** E911/E112 handling (`telephony/emergency-services`).

### **5. Data & Infrastructure**

* **Databases:** PostgreSQL, Redis, Qdrant, Time-series schemas (`databases/`).
* **Infrastructure:** Terraform & Ansible modules (`infrastructure/`, `deployment/`).
* **Monitoring:** Prometheus, Grafana, Jaeger, ELK stack (`monitoring/`).

## Development Workflow

### Prerequisites

* Docker & Docker Compose
* Node.js 18+ & pnpm
* Python 3.9+

### Key Commands

* **Start Infrastructure:** `docker-compose -f docker/docker-compose.yml up -d`
* **Run Agent:** `cd agent && python agent.py`
* **Dev Mode (Backend):** `cd backend/<service> && pnpm dev`

## Configuration

* **Project Root:** `vigilant-raccoon-bounce/` (effectively `dukat-voice-saas`)
* **Service Configs:** Located in `config/` and individual service `src/config` dirs.
* **Telephony Config:** `config/livekit.yaml`, `telephony/sbc/kamailio/kamailio.cfg`.

## Conventions

* **Monorepo:** Centralized management of all services and infrastructure.
* **Microservices:** Loose coupling with defined API contracts (`api-specs/`).
* **Infrastructure as Code:** All resources defined in Terraform/Ansible.

## Success Metrics & Governance

### At Each Session Completion

* [ ] **Tests:** All tests pass (unit, integration, e2e).
* [ ] **Code Quality:** Code compiles without TypeScript errors.
* [ ] **Database:** Migrations run successfully.
* [ ] **Documentation:** API documentation updated.
* [ ] **Handoff:** Session handoff document completed.
* [ ] **Next Step:** Next session context prepared.

### At Phase Completion

* [ ] **Integration:** Phase integration tests pass.
* [ ] **Performance:** Benchmarks met.
* [ ] **Security:** Security scans clean.
* [ ] **Docs:** Documentation complete for phase.
* [ ] **Deployment:** Deployment ready for phase components.

### At Project Completion

* [ ] **System:** Full system integration working.
* [ ] **Scale:** Load testing passes production requirements.
* [ ] **Audit:** Security audit completed.
* [ ] **Compliance:** Compliance documentation ready.
* [ ] **Production:** Production deployment automated.
