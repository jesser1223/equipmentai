## Current Development Stage
**Stage**: Workflow Automation Batch 3 — Overdue Invoice Reminders  
**Date**: 2026-10-29  
**Status**: Implemented. Company setting autoSendOverdueReminders (default false). InvoiceEmail.type (INVOICE/REMINDER). Daily Vercel cron sends one reminder per eligible invoice. Atomic claim prevents duplicates. Failed sends clear the claim so they can retry. Payment status is never changed by the reminder.

## Schema
- Organization.autoSendOverdueReminders Boolean @default(false)
- Invoice.overdueReminderClaimedAt DateTime?
- InvoiceEmail.type String @default("INVOICE")

Run: npx prisma db push

## Cron
- Path: /api/cron/overdue-reminders
- Schedule: 0 14 * * * (daily at 14:00 UTC)
- Auth: Authorization: Bearer CRON_SECRET

## Env
- CRON_SECRET (required)
- RESEND_API_KEY and RESEND_FROM (already used)

## Files
- prisma/schema.prisma
- src/app/api/cron/overdue-reminders/route.ts
- src/app/api/settings/route.ts
- src/app/(app)/settings/page.tsx
- src/app/api/invoices/[id]/email/route.ts
- src/app/api/invoices/[id]/issue/route.ts
- vercel.json
- PROGRESS.md
