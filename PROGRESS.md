## Current Development Stage
**Stage**: Maintenance Tracking Batch  
**Date**: 2026-10-23  
**Status**: Maintenance records, hour-meter validation, service status (Overdue / Due soon / Current / Not configured), dashboard counts, and equipment list status are implemented. Existing invoicing, customers, quotes, jobs, auth, and organization ownership are preserved.

## Features Completed and Tested
- Additive `MaintenanceRecord` model with server-side total cost
- Create / list / edit / delete maintenance records with organization scoping
- Hour-meter update validation (rejects older or negative readings)
- Service status calculation from saved records and equipment fields (hour-based and date-based)
- Due-soon thresholds: 50 hours / 14 days (fixed, consistent)
- Equipment list shows service status and hour meter
- Dashboard reports combined overdue + due-soon count
- New /maintenance page for recording service
- Unit tests for cost totals, hour validation, and status cases

## Files Created or Changed
- `prisma/schema.prisma` — added `MaintenanceRecord` model and relations
- `src/lib/maintenance.ts` — cost, status, and hour-meter helpers
- `src/app/api/maintenance/route.ts`, `src/app/api/maintenance/[id]/route.ts`
- `src/app/api/equipment/route.ts` — attaches `serviceStatus`
- `src/app/api/dashboard/route.ts` — real maintenance counts
- `src/app/(app)/equipment/page.tsx` — service status column
- `src/app/(app)/maintenance/page.tsx` — new maintenance UI
- `src/components/sidebar.tsx` — Maintenance nav item
- `src/__tests__/maintenance.test.ts`
- `PROGRESS.md`

## Known Bugs and Unfinished Work
- Production database requires `npx prisma db push` (or migrate) for the new `MaintenanceRecord` table
- Due-soon thresholds are fixed (50 hours / 14 days); not yet configurable in settings
- Maintenance record edit UI is API-only; list page currently supports create + view
- No soft-delete; DELETE removes the record (history is kept until explicitly deleted)
- Existing equipment `status = "Maintenance"` field is still independent of calculated service status

## Next Steps
- Apply schema change on Supabase / production (`npx prisma db push`)
- Preview equipment list service badges, dashboard counts, and new maintenance records on Vercel
- Optionally add edit UI and configurable due-soon thresholds later

## Important Commands
```
npx prisma db push
npx tsx src/__tests__/maintenance.test.ts
npx tsx src/__tests__/invoice-calc.test.ts
npm run build
```
