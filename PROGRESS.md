## Current Development Stage
**Stage**: Live Operations Dashboard + Named Job-Site Map Pins  
**Date**: 2026-10-25  
**Status**: Dashboard shows real metrics (active jobs, today, unassigned, available equipment, maintenance, outstanding balance). Map pins now display the job title as a permanent label above each marker. Today’s jobs, attention items, and recent activity (from actual records) are shown. No schema changes. Invoice and maintenance logic unchanged.

## Dashboard Metrics
- **Active Jobs**: count of jobs with status Scheduled or In Progress
- **Today**: jobs whose startDate or endDate falls on the current calendar day
- **Need Equipment**: active jobs with no equipmentId
- **Available Equipment**: equipment with status = "Available"
- **Maintenance**: overdue + due-soon counts from existing service status logic
- **Outstanding**: sum of (total - amountPaid) on non-Paid, non-Void invoices

## Map
- Uses existing Leaflet + OpenStreetMap (no new provider or API key)
- Job title is rendered as a permanent DivIcon label above each pin
- Long titles are truncated; full name is in the popup
- Jobs without a resolvable location are listed as unresolved and are not placed with fabricated coordinates

## Files Changed
- `src/app/api/dashboard/route.ts`
- `src/components/metric-cards.tsx`
- `src/components/map-preview.tsx`
- `src/components/dashboard-extras.tsx` (new)
- `src/app/(app)/page.tsx`
- `PROGRESS.md`

## Manual Checks
- Dashboard cards link to the correct pages
- Map shows job names above pins
- Today’s jobs and attention sections appear when data exists
- Empty org shows empty states without errors
- Refresh does not duplicate markers
