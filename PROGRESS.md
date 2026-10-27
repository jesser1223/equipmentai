## Current Development Stage
**Stage**: Fix Job Completion vs. Invoice Calculation Mismatch  
**Date**: 2026-10-26  
**Status**: Complete Job summary and invoice draft now use the same `calculateJobCharges` function. Attachment selections are saved on the job and used when creating the draft. Totals match.

## Why they differed
The Complete form charged each selected attachment at its own rate. The invoice draft only charged equipment hours × rate + fuel and ignored per-attachment lines.

## How they share logic
Both call `src/lib/job-billing.ts` → `calculateJobCharges`. The complete endpoint stores the selected attachments in `Job.attachmentUsage`. The invoice draft reads that and produces the same lines, subtotal, GST, and total.

## Schema
Added optional `attachmentUsage Json?` on Job. Run `npx prisma db push`.

## Tests
`src/lib/job-billing.test.ts` covers hourly + attachments + fuel + GST, missing rates, and zero tax. Run with the project’s test runner if available.
