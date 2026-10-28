## Current Development Stage
**Stage**: Workflow Automation Batch 1 — Company Settings  
**Date**: 2026-10-27  
**Status**: Organization settings now include autoSendInvoices (default false), overdueReminderDays (default 7), and quoteFollowUpDays (default 3). Settings page has a Workflow Automation section. Server validates 1–90. No emails are sent. No cron jobs were added. No invoice, quote, or billing behavior changed.

## Schema
Added to Organization:
- autoSendInvoices Boolean @default(false)
- overdueReminderDays Int @default(7)
- quoteFollowUpDays Int @default(3)

Run: npx prisma db push

## Files
- prisma/schema.prisma
- src/app/api/settings/route.ts
- src/app/(app)/settings/page.tsx
- PROGRESS.md
