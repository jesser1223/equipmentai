## Current Development Stage
**Stage**: Replace invoice issue alerts with a modal  
**Date**: 2026-10-27  
**Status**: Issuing an invoice now shows a themed modal instead of a browser alert. Separate messages for issued+emailed, issued+skipped, issued+failed, and issuance failure. Email is only reported as sent when the server confirms it. Retry opens the existing manual email flow. No API or billing changes.
