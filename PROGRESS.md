## Current Development Stage
**Stage**: Job Completion Form with Actual Hours and Attachments  
**Date**: 2026-10-26  
**Status**: Complete Job now opens a form that shows the assigned equipment, requires actual hours when equipment is assigned, lets the user select attachments and enter hours for each, records fuel cost and notes, and shows a summary before confirming. Attachment hours are summed into actualAttachmentHours and listed in completion notes. No schema changes.

## How it works
1. Click **Complete** on a scheduled job.
2. Enter actual equipment hours (required if equipment is assigned).
3. Check any attachments that were used and enter hours for each.
4. Optionally enter driving hours, fuel cost, and notes.
5. Review the summary and click **Confirm Completion**.

## Files
- `src/app/(app)/schedule/page.tsx`
- `PROGRESS.md`
