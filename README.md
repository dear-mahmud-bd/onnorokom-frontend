# OnnoRokom Assignment System — Frontend

This is the **frontend** of the Assignment & Submission Management System — a production Next.js web app that Rails the three dashboards (**Admin**, **Teacher**, **Student**) on top of the ASP.NET Core backend in `backendS/`.

This guide takes you from an empty machine to a running UI on **http://localhost:3000**. The frontend talks to the backend API, so getting it running means bringing up the backend too — both options below handle that.

> The whole system (API + databases + brokers + Nginx + this frontend) is orchestrated by `backendS/docker-compose.yml`. For the full product story, spec, and architecture, read the [root README](../README.md).

---

## 1. What this app is

| Role | What the UI lets them do |
|---|---|
| **Admin** | Provision Teacher/Student accounts, manage classes & subjects, assign teachers to subject–class pairs, enroll students, list/activate/deactivate users |
| **Teacher** | Create/update/delete assignments, publish/draft them, review submissions, award marks (≤ max marks), feedback, and status |
| **Student** | Browse published assignments for their class, keyword-search assignments (scoped to their class), upload files to submit/resubmit, see status/marks/feedback, live notifications |

Role-based authorization is enforced by the **backend API** on every protected endpoint — the UI only gates *routing* and hides features; it never trusts itself.

---

## 2. Technology stack and what each piece is for

| Technology | Where | Purpose in this app |
|---|---|---|
| **Next.js 16** (App Router) | root `package.json` | Application framework — file-based routing, layouts, server components, middleware-style auth redirects, `next.config.ts` API-rewrite proxy |
| **React 19** | `src/components`, `src/context` | UI components; contexts for auth (`AuthContext`) and live notifications |
| **TypeScript 5** (strict) | whole `src/` | Type safety across the app and the backend API payloads |
| **Tailwind CSS 4** | `src/app/globals.css`, `postcss.config.mjs` | Utility-first styling for fast, consistent UI |
| **Zod 4** | `src/lib/validation` | Shared validation schemas for forms (login, change password, assignment, submission, user provisioning) |
| **React Hook Form + `@hookform/resolvers`** | `src/components` forms | Form state + Zod schema wiring with server-side error mapping |
| **@microsoft/signalr** | `src/lib/realtime` | Real-time client for the backend's `NotificationHub` (assignment published / grade posted) |
| **API client layer** | `src/lib/api` | Typed fetch wrappers per resource (auth, users, classes, subjects, assignments, submissions, enrollments, GraphQL) |
| **GraphQL client** | `src/lib/api/graphql.ts` | Minimal fetch wrapper around the backend's HotChocolate `/graphql` endpoint |
| **Jest + React Testing Library** | `jest.config.ts`, `src/**/*.test.ts(x)`, `src/test` | Unit/component tests (auth-guard redirects, form validation) using `next/jest` + jsdom |
| **ESLint 9 (`eslint-config-next`)** | `eslint.config.mjs` | Linting |
| **Dockerfile** (`output: "standalone"`) | `Dockerfile` | Production build image used by `backendS/docker-compose.yml` |

### How the frontend talks to the backend — a key design detail

The app never exposes backend origins to the browser. `next.config.ts` defines **rewrites** so all calls are same-origin:

```
/api/:path*   → ${API_BASE_URL}/api/:path*
/graphql      → ${API_BASE_URL}/graphql
/hubs/:path*  → ${API_BASE_URL}/hubs/:path*
```

So the browser only ever talks to the Next dev server / Next standalone server, which proxies to the ASP.NET Core API. No CORS configuration is needed, and tokens stay out of the API's cross-origin scope.

---

## 3. What's inside

```
onnorokom-frontend/
├── public/                     # Static assets
├── src/
│   ├── app/                    # App Router — pages & layouts
│   │   ├── (marketing)/        # Public landing page
│   │   ├── (auth)/             # Login, verify-email, change-password
│   │   ├── (app)/              # Protected area
│   │   │   ├── admin/          #   Admin dashboard (users, classes, subjects, teacher assignments)
│   │   │   ├── teacher/        #   Teacher dashboard (assignment CRUD, grading)
│   │   │   ├── student/        #   Student dashboard (browse, submit, status)
│   │   │   ├── dashboard/      #   Per-role dashboard
│   │   │   └── forbidden/      #   Access-denied page
│   │   ├── layout.tsx          # Root layout (fonts, providers)
│   │   ├── providers.tsx       # Auth + notifications providers
│   │   ├── globals.css         # Tailwind entry
│   │   └── error.tsx / not-found.tsx
│   ├── components/             # Feature components (auth, admin, teacher, student, notifications, search)
│   ├── context/                # AuthContext, NotificationsContext (React context)
│   ├── lib/
│   │   ├── api/                # Typed fetch clients per backend resource + shared client + GraphQL
│   │   ├── auth/               # Session helpers + role-based route redirects
│   │   ├── realtime/           # SignalR notification client
│   │   ├── student/            # Student-facing data helpers
│   │   └── validation/         # Zod schemas shared with forms
│   ├── types/                  # TypeScript models mirroring backend DTOs
│   └── test/                   # Test utilities/setup
├── jest.config.ts              # next/jest config (jsdom, @/* alias)
├── next.config.ts              # Standalone output + API rewrites
├── tailwind + postcss configs
├── Dockerfile                  # Standalone production image
└── .env.example                # Copy to .env.local
```

---

## 4. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js + npm | **>= 20** (npm bundled) | `node --version` |
| Docker + Docker Compose | recent stable | Only needed for the backend & datastores (Option A, and Option B's datastore step) |
| Backend | — | Must be running; the frontend is only a UI over `backendS/` |

---

## 5. Configure the environment

```bash
cp .env.example .env.local          # Windows CMD: copy .env.example .env.local
```

`.env.local` (gitignored; never commit it) lets you point the frontend at a backend that is **not** on the default port:

| Variable | Default | Purpose |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8080` | Origin of the ASP.NET Core API that the Next rewrites proxy to |

If the backend runs on the default `8080` (matching `backendS/.env.example`'s `API_PORT_1`), you can skip the copy entirely.

---

## 6. Run the frontend — two ways

Both options expect the **backend to be reachable**. Pick whichever fits your workflow.

### Option A — Whole stack (backend API + databases) in Docker, frontend run locally

1. Start the backend and everything it needs from `backendS/`:

   ```bash
   # from backendS/
   docker compose up -d postgres mongo redis elasticsearch zookeeper kafka rabbitmq --wait
   ```

   (Or build & run the whole compose stack, including Nginx + the UI image, with `docker compose up -d --build --wait` — in that case you're done at step 3 of Option A below, visit http://localhost/.)

2. Run this frontend:

   ```bash
   # from onnorokom-frontend/
   npm install
   npm run dev
   ```

3. Open **http://localhost:3000**.

### Option B — Full local dev (fastest iteration on both stacks)

**Step 1 — datastores** (from `backendS/`):

```bash
docker compose up -d postgres mongo redis elasticsearch zookeeper kafka rabbitmq --wait
```

**Step 2 — backend** (from `backendS/`), which auto-migrates + seeds the demo dataset:

```bash
dotnet run --project backend        # API on http://localhost:8080, Swagger on /swagger
```

**Step 3 — frontend** (from `onnorokom-frontend/`):

```bash
npm install
npm run dev                         # UI on http://localhost:3000
```

**Step 4** — open **http://localhost:3000** and sign in with one of the demo accounts.

> `npm run dev` rewrites `/api`, `/graphql`, `/hubs` to the API at `API_BASE_URL` (localhost:8080), so the browser sees a single origin — no CORS, no explicit API URL to configure in the app.

---

## 7. Verify it works

1. Landing page loads at **http://localhost:3000**.
2. Go to `/login` and sign in (see demo credentials below).
3. After login you land on the role-aware dashboard:
   - `admin@demo.local` → **Admin dashboard** (create users, manage classes/subjects)
   - `teacher@demo.local` → **Teacher dashboard** (create/publish an assignment, review submissions, grade)
   - `student@demo.local` → **Student dashboard** (browse, submit a file before the deadline, then see status)
4. Expected failure paths (prove the guard works): an anonymous user hitting `/dashboard` is redirected to `/login`; a student hitting an admin route is redirected to `/forbidden`.

### Demo accounts (seeded by the backend on first startup)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.local` | `Admin!Passw0rd-2026` |
| Teacher | `teacher@demo.local` | `Teacher!Passw0rd-2026` |
| Student | `student@demo.local` | `Student!Passw0rd-2026` |

---

## 8. Quality gates — lint, tests, build

```bash
npm run lint       # ESLint (eslint-config-next)
npm test           # Jest + React Testing Library (jsdom) — single run
npm run test:watch # watch mode
npm run build      # production build (output: standalone)
```

### What the tests cover

- **Auth guards** — `src/lib/auth/redirect.test.ts`: unauthenticated → `/login`; wrong-role → `/forbidden`.
- **Validation** — Zod schemas reject disallowed file types / oversized files, invalid emails, weak passwords, marks > max marks.
- **Components** — key forms render handlers and surface server errors.

---

## 9. Gotchas

- **Next.js 16 conventions differ from older docs.** When changing code, consult `node_modules/next/dist/docs/` rather than Next 15 training-data habits.
- The Bash above assumes a POSIX shell; on Windows CMD/PowerShell use `copy .env.example .env.local`.
- `.next/` and `node_modules/` are local build artifacts — recreate them with `npm install` / `npm run dev`, never commit them.
- The frontend cannot run on its own — with the backend down, the login call fails (as it should). Start the backend per section 6 first.
- For a production-shaped run, build the Docker image (`docker build -t onnorokom-fe .`) or use the compose stack; the dev server is for development only.

---

## 10. Related docs

- **Backend API guide (run it, tech/purpose table):** [`backendS/README.md`](../backendS/README.md)
- **Full product spec (what/why):** [`docs/spec/PROJECT_SPEC.md`](../docs/spec/PROJECT_SPEC.md)
- **Architecture (how) & data model:** [`docs/design/ARCHITECTURE.md`](../docs/design/ARCHITECTURE.md), [`docs/design/ERD.md`](../docs/design/ERD.md)
- **Task index:** [`docs/tasks/TASKS.md`](../docs/tasks/TASKS.md)