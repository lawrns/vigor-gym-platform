# Instructions for Codebase-AI

Read all important documents in the repository root, especially:
- AI-Powered Gym Software Feature Roadmap.md
- Mexican Market Regulations and Compliance Analysis.md
- Technical Architecture and AI Infrastructure Analysis.md
- Gym Management Software Market Overview.md
- Go-to-Market Strategy for AI-Powered Gym Management Software in Mexico.md

Then synthesize the PRD and generate the 9 JSON specs exactly as named below in this /instructions/ folder. Validate cross-links before finishing.

Preferred conventions
- User-facing copy: Spanish (es-MX). Currency: MXN.
- Code, IDs, and keys: English, kebab-case for IDs.
- Default stack: Next.js (app router) + TypeScript + Tailwind + shadcn/ui + Framer Motion + Prisma (Postgres/Supabase) + tRPC/REST; Mobile via Expo.
- Compliance: biometric consent capture and honoring; support CFDI (4.0) invoice fields for Mexico.

Outputs to produce
1) PRD: PRD.md
2) Project Manifest: project.manifest.json
3) Design Tokens: design.tokens.json
4) UI Components Library: ui.components.json
5) Navigation & Routes: navigation.routes.json
6) Domain & Database Schema: domain.schema.json
7) API Contracts (OpenAPI 3.1): api.openapi.json
8) Workflows & Events: workflows.state.json
9) AI Vision Pipeline: ai.vision.json
10) Analytics, Telemetry & KPIs: analytics.metrics.json

Cross-file validation checklist (must be true)
- Every route in navigation.routes.json has role access and is covered by screens using components from ui.components.json (e.g., navbar on protected pages; scan-progress-card on /scans; cfdi-invoice-form on /billing/invoices).
- All entity references in domain.schema.json are resolvable (FKs valid).
- api.openapi.json schemas mirror domain.schema.json shapes (no drift in types/enums/IDs).
- workflows.state.json events map to API actions and DB entities (scan and billing pipelines; membership lifecycle).
- ai.vision.json outputs exist as fields in BodyScan and are reflected in analytics events.
- Design token names are used by UI components via classNames.

Code generation mapping (for IDE/agents)
- design.tokens.json → tailwind.config.ts, app/globals.css, shadcn theme file.
- ui.components.json → /apps/web/src/components/* and motion presets; story files in /stories.
- navigation.routes.json → Next.js app router structure + Expo Router config.
- domain.schema.json → Prisma schema + initial migration + seed script.
- api.openapi.json → API handlers (tRPC/REST) + client SDK.
- workflows.state.json → BullMQ/Temporal jobs and cron configs.
- ai.vision.json → Vision service stub, consent screens, storage policy, and UI scan flow.
- analytics.metrics.json → Analytics provider setup + typed event helpers.

Validation note
- Prefer minimal, correct stubs that satisfy schemas and cross-links over speculative features. Extend only where obvious from PRD and documents.
