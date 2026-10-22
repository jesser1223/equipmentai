## UI Dialog Rule (Permanent)

All application dialogs must use the shared in-app components:

- `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`) for destructive or important confirmations.
- `Modal` (`src/components/ui/modal.tsx`) for forms and data entry.
- In-app toasts for success/error messages.

**Never use** `window.confirm()`, `window.alert()`, or `window.prompt()` for application interactions. These produce browser-native dialogs that look unprofessional and cannot be themed.

New features must reuse these components. Do not create one-off modal implementations.