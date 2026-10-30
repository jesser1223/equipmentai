## Current Development Stage
**Stage**: Batch 3 hardening  
**Date**: 2026-10-29  
**Status**: Claim expiry (30 minutes), uncertain outcome handling, HTML escaping, Overdue removed from eligibility. Installed Resend SDK has no idempotency-key option. Exactly-once delivery is not guaranteed.

## Claim recovery
- Active claim (under 30 minutes) cannot be taken by another run.
- Expired claim with no reminder email can be reclaimed.
- Expired claim with Queued reminder is marked Uncertain and is not resent.
- Confirmed Resend failure clears the claim for retry.
- Thrown send errors are marked Uncertain and the claim is kept.

## Tests run here
- Eligibility unit checks: passed (Issued/Partially Paid eligible; Draft/Paid/Void/zero/no-email skipped)
- Typecheck, ESLint, production build, Prisma validate: not executed (tooling incomplete in this environment)
