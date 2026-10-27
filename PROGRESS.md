## Current Development Stage
**Stage**: Workflow Automation Batch 1 — Job to Invoice Draft  
**Date**: 2026-10-26  
**Status**: Completed jobs can create a Draft invoice using actual saved hours and equipment rates. Duplicate invoices are prevented. Invoice remains Draft until the user reviews and issues it. Existing invoice calculations are reused. No automatic issuance or email.

## What was reused
- Existing job completion (actualHours, fuelCost, completionNotes)
- Existing Invoice model with unique jobId
- Existing invoice line + GST calculation pattern
- Existing organization taxRate and invoice numbering

## What was added
- POST `/api/jobs/[id]/invoice-draft` creates a Draft invoice from a completed job
- Uses equipment.hourlyRate × actualHours when both exist
- Includes fuelCost as a line when present
- Returns clear missing-info errors (no hours, no rate)
- Blocks if job is not Completed or already has an invoice
- Schedule page shows “Create Invoice Draft” on completed jobs without an invoice

## Files
- `src/app/api/jobs/[id]/invoice-draft/route.ts` (new)
- `src/app/(app)/schedule/page.tsx`
- `PROGRESS.md`

## Database
No schema changes required.

## Manual checks
1. Complete a job with actual hours and an equipment that has an hourly rate
2. Click “Create Invoice Draft”
3. Confirm a Draft invoice appears with correct subtotal, GST, and total
4. Try creating a second draft for the same job (should be rejected)
5. Complete a job with no hours or no rate and confirm the missing-info message
