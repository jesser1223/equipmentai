export default function DeniedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This company account does not currently have access to EquipmentAI. Contact the owner if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
