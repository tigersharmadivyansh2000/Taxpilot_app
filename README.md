# TaxPilot AI

An intelligent AI-powered tax filing assistant that guides taxpayers step-by-step through filing preparation, manages tax documents, generates dynamic checklists, compares Indian Income Tax regimes, and provides interactive AI tax consultations.

---

## Key Features

- **Multi-Profile Workspace Management**
  - Manage multiple taxpayer profiles (e.g., *Myself*, *Father*, family members, or clients) with independent folders, filing statuses (`Not Started`, `In Progress`, `Waiting for Documents`, `Ready to File`, `Filed`, `E-Verified`, `Completed`), checklists, documents, tasks, and notes.
  - Quick switcher in the sidebar and dedicated Taxpayer Profiles view with add/delete and demonstration reset support.
- **Executive Dashboard**
  - At-a-glance filing progress, checklist completion metrics, document readiness, active tasks, AI-generated tax-saving recommendations, and quick actions.
- **Step-by-Step Tax Filing Wizard**
  - Guided 6-step workflow covering Basic Details (PAN, Aadhaar, DOB, contact info), Residential Status, Employment Type, Income Sources, Tax Regime Selection (Old vs. New), and Final Review.
  - Automatically updates checklists dynamically based on selected income sources and taxpayer attributes, with an embedded step-aware AI Guide.
- **Dynamic Checklist**
  - Categorized filing checklist (*Identity*, *Income Verification*, *Deductions*, *Filing*) that adapts to the active taxpayer's profile and tracks completion percentage.
- **Document Manager**
  - Track, upload, and organize essential tax documents (PAN, Aadhaar, Form 16, Form 26AS, AIS, Bank Interest Certificates, etc.) with status tracking (`Uploaded`, `Missing`, `Needs Review`, `Expired`).
- **AI Tax Assistant & Recommendations**
  - Interactive conversational AI tax guide (`gemini-3.5-flash`) tailored to Indian Income Tax rules (ITR-1/ITR-2, Sections 80C, 80D, 80TTA/80TTB, HRA, Form 16, AIS/26AS reconciliation).
  - Structured AI recommendation engine surfacing deductions, missing proof alerts, and opportunities.
  - Graceful offline rule-based simulation fallback when `GEMINI_API_KEY` is not configured.
- **Tax Summary & Old vs. New Regime Calculator**
  - Interactive income and deduction calculator comparing **Old Tax Regime** vs. **New Tax Regime** (FY 2025–26 slabs, Standard Deduction, Section 87A rebate, and 4% Health & Education Cess), plus an AI Regime Compare Advisor.
- **Tasks, Notes, Global Search & Notifications**
  - Prioritized tax tasks with due dates, scratchpad notes per taxpayer, profile-scoped notifications, and global search across profiles, documents, checklist items, tasks, queries, and notes.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion
- **Backend:** Express.js (`server.ts`) serving both API routes and Vite middleware (dev) / static bundle (production)
- **AI Integration:** `@google/genai` (`gemini-3.5-flash`) via server-side `/api/tax-ai/*` proxy endpoints
- **Persistence:** JSON file store (`profiles_store.json`) seeded with default demonstration profiles

---

## Project Structure

```text
.
├── server.ts                    # Express server, API routes, Gemini AI integration & Vite/static serving
├── index.html                   # HTML entry point
├── metadata.json                # Applet metadata and capabilities
├── package.json                 # Dependencies and npm scripts
├── .env.example                 # Environment variable template
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Root layout, global search, notifications & profile state
    ├── types.ts                 # TypeScript interfaces for profiles, documents, tasks & AI data
    ├── index.css                # Tailwind CSS v4 theme & glassmorphism utilities
    └── components/
        ├── Sidebar.tsx          # Navigation sidebar & active taxpayer switcher
        ├── DashboardView.tsx    # Overview metrics, quick tasks & AI recommendations
        ├── ProfilesView.tsx     # Taxpayer profile creation, switching & management
        ├── WizardView.tsx       # Step-by-step guided tax filing wizard
        ├── ChecklistView.tsx    # Dynamic categorized tax checklist
        ├── DocumentsView.tsx    # Tax document tracker & manager
        ├── AiChatView.tsx       # Conversational AI tax assistant & bookmarked Q&As
        ├── TasksView.tsx        # Prioritized tasks & taxpayer notes
        └── TaxSummaryView.tsx   # Income/deduction calculator & regime comparison
