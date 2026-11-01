## Current Development Stage
**Stage**: Quote historical pricing fix  
**Date**: 2026-11-01  
**Status**: Invoice draft no longer falls back to the current equipment hourly rate. Missing quoted rate returns a clear error. Attachment usage snapshot now includes quantity, unit, and amount.

## Minimum billing
Not implemented. Attachment billing methods in the schema are hourly, daily, and per-job only. No minimum-charge rule exists elsewhere.

## Database
No .env in this environment. prisma db push was not run here. Run it locally:
npx prisma db push
