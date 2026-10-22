# EquipmentAI

Equipment management platform with local database persistence.

## Authentication
- Sign up at `/signup` (creates a company + user)
- Sign in at `/login`
- Protected routes redirect unauthenticated users to login
- Forgot password page is present; real emails require Resend/Postmark configuration

## Setup
```cmd
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open **http://localhost:3000**

## What works now
- **Equipment**: Add, list, search, delete. Data persists in SQLite.
- **Quotes**: Create quotes with line items, auto-calculated totals, customer + equipment selection.
- **Customers**: Add and list.
- **Dashboard**: Metrics pulled from the database.
- **Map**: Interactive OpenStreetMap showing equipment that have latitude/longitude.
- **Theme**: Working light/dark toggle (persists across reloads).
- Navigation between all main pages.

## Database
Uses SQLite locally (`dev.db`). To switch to PostgreSQL later, change `DATABASE_URL` in `.env` and update the Prisma provider.

## Notes
- No authentication yet (single-tenant for local use).
- Invoice and full job completion workflows are partially scaffolded (API routes exist; UI can be expanded).
- Email / PDF generation not yet configured.
