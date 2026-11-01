## Current Development Stage
**Stage**: Workflow Automation Batch 4 — Quote Follow-Ups  
**Date**: 2026-10-31  
**Status**: Implemented. Quote must be emailed successfully first. Follow-up toggle default off. One follow-up per quote. Optional expiresAt; no invented expiration.

## Schema
- Organization.autoSendQuoteFollowUps Boolean @default(false)
- Quote.sentAt, expiresAt, followUpClaimedAt
- QuoteEmail model (QUOTE / FOLLOWUP)

Run: npx prisma db push

## Cron
- /api/cron/quote-followups at 15 14 * * *
- Existing overdue cron preserved
- Auth: Authorization Bearer CRON_SECRET

## Original email
POST /api/quotes/[id]/email records QuoteEmail type QUOTE and sets sentAt only after Resend accepts.
