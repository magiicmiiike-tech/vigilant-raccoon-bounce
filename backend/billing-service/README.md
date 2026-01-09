# Billing Service (Stub)

This service performs metering of usage events and sends invoice/charge requests to Stripe.

Architecture:
- Kafka consumer reads `usage.events` topic
- Node.js service aggregates tenant usage and computes invoiceable amounts
- Communicates with Stripe via `stripe` Node SDK using service account

Security:
- All keys stored in Secrets Manager and injected via ExternalSecrets

Important: Implement idempotency and reconciliation routines for Stripe webhooks.