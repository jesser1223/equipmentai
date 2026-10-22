## Current Development Stage
**Stage**: Approval and subscription enforcement audit  
**Date**: 2026-10-21  
**Status**: Approval is enforced on the server for pages and APIs. There is no Stripe or subscription system. Password reset remains deferred.

## Features Completed and Tested
- Organization approval statuses: Pending, Approved, Denied, Suspended
- Signup creates an organization as Pending
- Owner approval, denial, suspension, and restore with audit logs
- Server-side approval enforcement in middleware, app layout, and operational API routes
- Owner account remains allowed even if its organization is not Approved
- Access policy tests in `src/__tests__/access.test.ts`

## Files Created or Changed
- `src/lib/access.ts` — approval access policy
- `src/auth.ts` — refresh organization status from the database on each session check
- `src/middleware.ts` — block non-approved companies; return 403 for APIs; keep owner access
- `src/app/(app)/layout.tsx` — server-side redirect for non-approved companies
- Operational API routes — reject pending, denied, and suspended organizations
- `src/__tests__/access.test.ts` — focused approval policy tests

## Known Bugs and Unfinished Work
- No Stripe integration and no subscription statuses (canceled, expired, past-due, incomplete, unpaid)
- Approval status in the middleware cookie can be one request behind; API routes and the app layout re-check the database
- Password reset is implemented but deferred until a verified sending domain exists
- Manual security checks from the M0 batch may still be outstanding

## Next Steps
1. Add a real subscription model and Stripe webhook only after deciding the billing rules
2. Finish the remaining manual M0 security checks
3. Configure the custom domain and Resend before enabling password-reset email

## Previous stage notes
Deletion fix, branded confirm dialog, and earlier dashboard work remain in the codebase. The notes below are historical.

## Features Completed and Tested
- Proper `ConfirmDialog` component (light/dark, keyboard, loading, error state)
- Equipment page uses the dialog instead of `window.confirm` / `alert`
- DELETE route clears QuoteLine and Job references before deleting
- Server logs the real error; client shows a useful message
- Success toast + automatic list refresh

## Files Created or Changed
- `src/components/ui/confirm-dialog.tsx` — new branded confirmation dialog
- `src/app/equipment/page.tsx` — uses ConfirmDialog, handles loading/errors
- `src/app/api/equipment/[id]/route.ts` — safer delete that clears references
- `PROGRESS.md` — this update

## Known Bugs and Unfinished Work
- No authentication yet.
- Quote → Job → Invoice flow still partial.
- Map filters and click-to-record not implemented.
- Other destructive actions (if added later) should reuse ConfirmDialog.

## Next Steps
1. Verify delete works on demo equipment after re-extracting.
2. Continue with Supabase when ready.
3. Wire quote acceptance → job conversion.
