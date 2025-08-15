# Product Requirements Document (PRD) — GymOS MX

Version: 0.1.0
Primary locale: es-MX (MXN)

## Vision & Goals
Build the first Mexican-first, AI-powered gym management and member engagement platform that combines core operations (memberships, billing, scheduling) with computer vision fitness features (body scanning, form analysis) and predictive analytics (churn, engagement) to improve member outcomes and gym profitability.

Goals (12 months):
- Reduce member churn by 20–30% with predictive outreach.
- Increase attendance/member by 15% via personalized nudges.
- Attain 200+ gym customers with >90% CSAT.
- Launch compliant biometric consent and CFDI invoicing.

## Users & Roles
- Owner (Propietario)
- Manager (Gerente)
- Trainer (Entrenador)
- Front-Desk/Staff (Recepción)
- Member (Miembro)
- Superadmin (internal)

## Top Jobs-to-be-done & Success Metrics
- Owner/Manager: Manage memberships, billing, and reporting; see real-time KPI dashboards. Metrics: MRR, ARPU, Churn, On‑time Invoice %.
- Trainer: Schedule classes, track client progress, run scans, act on AI coach prompts. Metrics: Class fill rate, Client adherence, Scan Adoption %.
- Front-Desk: Fast check-ins, new member onboarding, invoice issuance (CFDI). Metrics: Avg check-in time, Errors reduced, NPS (desk).
- Member: Book classes, track body progress, get personalized guidance. Metrics: MAU, Bookings/week, Body scan completion, Retention.

## Core Features
1) Management
- Members, plans, locations, staff roles (RBAC). Fast search, status, tags.

2) Billing
- Subscriptions/invoices (MXN). Methods: cards, SPEI, OXXO; CFDI 4.0 support.
- Spanish copy examples: “Pagar ahora”, “Descargar factura CFDI”, “Método de pago”.

3) Scheduling
- Class calendar, trainer assignment, capacity & waitlist.

4) CRM
- Segments (new, at‑risk), automated journeys, Spanish templates.

5) Reporting
- Dashboard: “Miembros Activos”, “Churn”, “Asistencias”, “Ingresos”.

## Member App Features (Expo/React Native)
- Booking (tabs: Home, Classes, Scan, Profile).
- Progress tracking: scans, charts (7d/30d/90d).
- Body-scan flow with consent screen; gamified streaks/badges.
- Notifications: recordatorios de clase, objetivos semanales.

## AI Features
- Vision scanning (mobile-first): body composition estimates (bodyFatPct, leanMassKg, waistCm, hipCm) and posture insights.
- AI coach: form tips, workout suggestions aligned to goals.
- Churn prediction: 30‑day risk and score; trigger playbooks.

## Mexico Specifics
- CFDI 4.0 invoicing fields; RFC, usoCFDI, régimen fiscal; storage 5 years.
- Payments: Mercado Pago + Stripe; OXXO, SPEI, tarjetas.
- Privacy/consent: Explicit biometric consent; encrypted storage; es‑MX UX.

## Constraints & Risks
- Regulatory uncertainty (AI, data transfers). Mitigation: conservative defaults, Mexican data centers, explicit consent.
- On-device accuracy/latency tradeoffs; hybrid edge/cloud.
- Adoption risk for small gyms; keep affordable & simple.

## 3‑Release Roadmap
- R1 (0–90d): Core management + billing + scheduling; JWT auth; RBAC; basic analytics; mobile tabs; smartphone body‑scan MVP; churn risk v0; CFDI stubs; Spanish UX; Postgres + Prisma; REST/tRPC seed.
- R2 (91–180d): Advanced AI (3D composition, better pose), retention playbooks, wearable sync, reporting v2, invoice automation + reminders, BullMQ jobs.
- R3 (181–360d): BI dashboards, optimization models, ecosystem integrations, franchise/multi‑location, edge acceleration.

## The 9 JSON Specs (authoritative for generation)
- project.manifest.json — monorepo, packages, envs, roles, integrations.
- design.tokens.json — Tailwind/shadcn theme tokens.
- ui.components.json — reusable components, props, variants, motions.
- navigation.routes.json — web/mobile routes, guards, layouts.
- domain.schema.json — entities, relations, constraints, indexes, seeds.
- api.openapi.json — REST contracts + security.
- workflows.state.json — events, crons, state machines.
- ai.vision.json — model options, consent, storage, outputs.
- analytics.metrics.json — events, funnels, KPIs, governance.

## Compliance Notes (MX)
- Biometric data: explicit consent required; privacy-by-design; encryption; retention minima (0 days for raw images unless consented).
- CFDI: Issue/validate electronic invoices in real time; store for 5 years; include RFC/usoCFDI/régimen fiscal.

## Non‑Goals (current scope)
- Full hardware IoT integrations (beyond basic check-in) in R1.
- Telemedicine and genetic data integrations.

## Open Questions
- Which SAT PAC provider for CFDI certification? (TBD in implementation)
- Preferred payments split: Mercado Pago vs Stripe per segment?
