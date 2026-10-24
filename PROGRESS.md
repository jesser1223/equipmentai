## Current Development Stage
**Stage**: Job Completion, Actual Usage Tracking, and Equipment Utilization  
**Date**: 2026-10-23  
**Status**: Jobs can be completed with actual hours, attachment hours, driving hours, fuel, and notes. Completing a job with actual hours updates the equipment hour meter. Utilization report aggregates recorded actualHours from completed jobs. Financial summary shows invoice revenue and recorded fuel costs separately. Maintenance and invoice calculations are unchanged.

## Features Completed and Tested
- POST `/api/jobs/[id]/complete` records actuals and sets status to Completed (blocks duplicate completion)
- Hour meter is increased by actualHours (validated, never decreased)
- GET `/api/utilization` with optional date range (from recorded completed jobs only)
- GET `/api/jobs/financial` (revenue from non-void invoices, fuel costs recorded separately)
- Schedule page has Complete button and actuals form
- New Utilization page in sidebar

## Files Created or Changed
- `prisma/schema.prisma` — added completedAt, actualHours, actualAttachmentHours, drivingHours, fuelLiters, fuelCost, completionNotes on Job
- `src/app/api/jobs/[id]/complete/route.ts`
- `src/app/api/utilization/route.ts`
- `src/app/api/jobs/financial/route.ts`
- `src/app/(app)/schedule/page.tsx` — Complete workflow
- `src/app/(app)/utilization/page.tsx`
- `src/components/sidebar.tsx` — Utilization link
- `PROGRESS.md`

## Known Bugs and Unfinished Work
- Supplies and maintenance costs are not yet attributed to individual jobs (financial report notes this)
- No per-job supply usage tracking
- Utilization only counts jobs that have actualHours recorded

## Next Steps
- Run `npx prisma db push` for the new Job fields
- Preview complete workflow, hour-meter update, and utilization page on Vercel
- Optionally attribute supplies to jobs in a later batch

## Important Commands
```
npx prisma db push
npm run build
```
 
