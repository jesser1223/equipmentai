## Current Development Stage
**Stage**: Attachment-Aware Utilization + Remove Equipment Map Fields  
**Date**: 2026-10-26  
**Status**: Machine utilization uses actualHours only. Attachment hours are tracked separately from attachmentUsage and are never added to the machine total or hour meter. Equipment form lat/lng map fields removed. Job-site map unchanged. No schema changes.

## Utilization rules
- Machine hours = sum of job.actualHours on completed jobs
- Attachment hours = sum of hours from job.attachmentUsage (only when recorded)
- Attachment hours are not added to the machine
- Hour meter increases by actualHours only (already the case in complete route)
- Missing attachment hours stay unknown

## Equipment map
Removed optional Latitude/Longitude fields from the equipment form. No dedicated equipment map page existed. Job-site map on the dashboard is unchanged.
