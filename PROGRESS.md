## Current Development Stage
**Stage**: Batch 6 payment receipts  
**Date**: 2026-11-03  
**Status**: Optional receipt email after a payment is recorded. Does not send automatically. Does not change payment math.

## Schema
InvoiceEmail.paymentId optional. Type RECEIPT.

Run: npx prisma db push

## Balance
Remaining balance is invoice total minus payments recorded through the selected payment.
