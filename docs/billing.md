# Billing Integration Guide

This guide outlines how to integrate Stripe with the `billing-service`.

1. Create Stripe account and set up Connect (for marketplace or sub-merchant flows)
2. Provision a service account and store keys in Secrets Manager
3. Billing service subscribes to `usage.events` (Kafka) and aggregates usage
4. Implement idempotent charge creation using `idempotency_key` in Stripe
5. Implement webhook handling and reconciliation for disputes and refunds
6. Add billing dashboards and retention reports for 7 years (compliance)

Security: ensure PCI compliance when handling card data; use Stripe-hosted checkout whenever possible.