## Current Development Stage
**Stage**: 30-day trial and Grok AI assistant  
**Date**: 2026-11-26  
**Status**: Implemented in code. Not production-activated until database push, XAI_API_KEY, and deploy are done.

## Still required
- Run `npx prisma db push` for trial reminder fields and AI tables.
- Set `XAI_API_KEY` in Vercel. Optional: `GROK_MODEL` (default grok-4.20), `GROK_TRIAL_TOKEN_LIMIT`, `GROK_PAID_TOKEN_LIMIT`.
- Do not treat the assistant as live until a real company test is done after deploy.
