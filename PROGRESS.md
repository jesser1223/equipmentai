## Current Development Stage
**Stage**: Audit — automatic invoice email "not configured"  
**Date**: 2026-10-27  
**Status**: Findings only. Issue route now returns the same specific config messages as the manual email route.

## Why email was skipped
The issue route checks the same variables as the manual email route:
- `RESEND_API_KEY`
- `RESEND_FROM`

It skips when either is missing, or when `RESEND_FROM` ends with `@resend.dev`. The previous message lumped all three into "Email is not configured".

## Required Vercel environment variables (Production)
- `RESEND_API_KEY` = your Resend API key
- `RESEND_FROM` = an address on your verified domain (not `...@resend.dev`)

After setting or changing them, redeploy. The issue route does not call a different service; it uses the same Resend setup as manual send.
