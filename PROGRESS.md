## Current Development Stage
**Stage**: Customer history protection and quote-to-job  
**Date**: 2026-10-21  
**Status**: Customer deletion no longer removes historical records. Quotes can be accepted and converted to jobs. Invoice calculations were not changed.

## Features Completed and Tested
- Customer delete is blocked when quotes, jobs, or invoices exist
- Customer archive/restore, edit, search, and history view
- Archived customers cannot be selected for new quotes or jobs
- Quote status actions: Sent, Accepted, Declined
- Quote tax uses the organization decimal convention (0.05 = 5%)
- Accepted quote converts to one job using Job.quoteId
- Company settings expose GST number, logo URL, invoice footer, and reply-to email

## Files Created or Changed
- `prisma/schema.prisma` — additive `Customer.archivedAt`
- `src/lib/customers.ts`, `src/lib/quotes.ts`
- `src/app/api/customers/[id]/route.ts`
- `src/app/api/quotes/route.ts`, `src/app/api/quotes/[id]/route.ts`, `src/app/api/quotes/[id]/convert/route.ts`
- `src/app/(app)/customers/page.tsx`, `src/app/(app)/quotes/page.tsx`, `src/app/(app)/settings/page.tsx`
- `src/__tests__/customer-quote-workflow.test.ts`

## Known Bugs and Unfinished Work
- Production database needs `npx prisma db push` before archive works
- No Stripe or subscription enforcement
- Password reset still needs a verified sending domain

## Next Steps
- Apply the additive schema change to the Supabase database
- Preview customer archive, quote conversion, and settings on Vercel

## Important Commands
```
npx prisma db push
npx tsx src/__tests__/customer-quote-workflow.test.ts
npm run build
```
