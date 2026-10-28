## Current Development Stage
**Stage**: Workflow Automation Batch 2 — Automatic Invoice Emailing  
**Date**: 2026-10-27  
**Status**: Issuing a Draft invoice sets it to Issued. If the organization's autoSendInvoices is true and the customer has an email, the existing Resend email path is used and the attempt is recorded in InvoiceEmail. Default remains off. No reminders, follow-ups, or cron. Manual Email button still works.

## Trigger
POST /api/invoices/[id]/issue — only from Draft. Status is saved first, then email is attempted outside the status update.

## Duplicate prevention
- Only Draft invoices can be issued
- Skips auto-send if an InvoiceEmail with status Sent already exists for that invoice
- Manual Email remains available for retries

## Failure handling
- Invoice stays Issued if email fails
- Failure is recorded on InvoiceEmail
- User sees a distinct message: issued vs emailed / skipped / failed

## Files
- src/app/api/invoices/[id]/issue/route.ts (new)
- src/app/(app)/invoices/page.tsx
- PROGRESS.md

## Schema
No schema changes.
