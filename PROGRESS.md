## Current Development Stage
**Stage**: Quote attachment pricing Stage 1  
**Date**: 2026-11-01  
**Status**: Quote lines can store attachment id, name, billing method, rate, quantity, and amount. Server calculates totals. Conversion copies quoted attachment rates into job.attachmentUsage and quoted equipment rate onto the job. Invoice draft prefers the quoted equipment rate.

## Schema
- QuoteLine.attachmentId, lineType, billingMethod, attachmentName
- Job.quotedEquipmentRate

Run: npx prisma db push

## Billing
- hourly: quantity x rate
- daily: quantity (days) x rate
- per-job: rate once
- Missing attachment rate is rejected server-side
