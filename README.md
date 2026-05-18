# CleanOps AI

**Autonomous Data Reliability Platform** — profile, repair, monitor, and govern datasets with AI-assisted quality workflows.

**Live demo → [clean-ops-ai.vercel.app](https://clean-ops-ai.vercel.app)**

---

## What it does

CleanOps AI gives data teams a single place to understand and improve the quality of their datasets — without writing SQL or custom scripts.

- **Profile** any CSV, XLSX, or Parquet file and get an instant trust score, null rates, type distributions, and outlier detection
- **Repair** issues with one click or natural-language commands ("fill missing ages with median")
- **Monitor** for drift: schema changes, distribution shifts, and volume anomalies compared to a baseline
- **Alert** when quality drops below thresholds you define (trust score, null rate, issue count)
- **Contract** datasets with expected schema, row counts, and freshness SLAs — violations fire alerts automatically
- **Import** from URLs, Google Sheets, or PostgreSQL — not just file uploads
- **Track** every profiling run and repair as a lineage graph showing data provenance
- **Manage** users with role-based access (admin / analyst / viewer)

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS v4, TanStack Query, React Flow |
| Backend | FastAPI (async), SQLAlchemy + asyncpg, Pandas, scikit-learn |
| Auth | JWT (python-jose) + bcrypt |
| AI | Claude claude-sonnet-4-6 via Anthropic API — NL repair commands, schema suggestions |
| Database | PostgreSQL (production), SQLite (local dev) |
| Deployment | Render (backend) · Vercel (frontend) |

---

## Running locally

**Backend**
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

> Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`.

---

## Project structure

```
CleanOps-AI/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (datasets, jobs, alerts, contracts, auth)
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── services/     # Business logic (profiling, repairs, drift, lineage, AI)
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/   # Reusable UI (Header, Sidebar, AlertBell, LineageGraph, …)
        ├── pages/        # Route-level views
        ├── hooks/        # TanStack Query hooks
        └── api/          # Axios client + endpoint wrappers
```

---

## Features by phase

| Phase | Features |
|-------|---------|
| 1 — MVP | Upload, profile, trust score, NL repair commands, audit trail |
| 2 — AI Layer | AI-suggested repairs, column-level scoring, smart issue grouping |
| 3 — Enterprise | Job queue, data connectors, lineage graph, drift monitoring, alerts, data contracts, RBAC |

---

Built by [Anvitha Anand](https://github.com/AnvithaAnand)
