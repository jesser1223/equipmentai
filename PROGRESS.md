## Current Development Stage
**Stage**: Schedule job editing  
**Date**: 2026-10-21  
**Status**: Jobs on the schedule can be edited and saved. Approval enforcement remains in place. Password reset is still deferred.

## Features Completed and Tested
- Edit button on each scheduled job
- Edit modal reuses the existing schedule form
- PATCH `/api/jobs/[id]` updates title, customer, equipment, dates, location, coordinates, notes, and status
- Equipment conflicts are checked against other jobs
- Company ownership is enforced on the update

## Files Created or Changed
- `src/app/(app)/schedule/page.tsx` — edit action and prefilled form
- `src/app/api/jobs/[id]/route.ts` — job update endpoint
- `PROGRESS.md` — this update

## Known Bugs and Unfinished Work
- No Stripe or subscription enforcement
- Password reset still needs a verified sending domain
- Job description is not a database field; use Notes

## Next Steps
1. Deploy this change and edit a job on the schedule
2. Decide billing rules before adding Stripe
