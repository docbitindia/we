# Docbit India

Professional **Data → Report → PDF** workflow for CSV, XLS, XLSX and JSON.

## Included
- React + Vite + TypeScript application
- Supabase authentication boundary
- PDF Report Studio with 10 distinct report templates
- Canonical report manifest shared by preview/PDF/job APIs
- Deterministic template recommendation
- Pre-flight validation
- Responsive report preview with zoom controls
- Server-side entitlement endpoint and seven-day trial database trigger
- Idempotent report-job API contract for large-data processing
- PWA manifest/service worker and offline-aware product boundary
- Netlify deployment configuration
- Supabase migration and production test plan

## Run
```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Environment
Copy `.env.example` to `.env` and configure Supabase. Payment and large-data worker secrets are server-only.

## Production boundary
Browser processing is used only for small/medium datasets. Large/very-large reports are intentionally routed to the server-job architecture instead of pretending that rendering hundreds of thousands of rows in a browser is safe. Apply the Supabase migration and connect object storage, queue, streaming ingestion and PDF workers before enabling that pipeline.
