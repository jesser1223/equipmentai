## Current Development Stage
**Stage**: Professional Utilization Filters  
**Date**: 2026-10-26  
**Status**: Utilization page has date presets (Today, This Week, This Month, Last 30 Days, This Quarter, This Year), custom range, equipment selector, search, and reset. Summary cards show operating hours, jobs, and machines. Attachments stay nested under their equipment. Utilization percentage is not shown because available hours are not tracked. No schema changes.

## Metrics
- Operating hours: sum of actualHours on completed jobs in the range
- Jobs: count of completed jobs with hours
- Machines: equipment with recorded hours
- Attachment hours: listed under the machine, not added to the machine total
