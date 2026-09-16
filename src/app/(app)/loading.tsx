export default function Loading() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="h-10 w-64 rounded-lg bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-white/[.06]" />
        <div className="h-28 rounded-2xl bg-white/[.06]" />
        <div className="h-28 rounded-2xl bg-white/[.06]" />
      </div>
      <div className="h-80 rounded-2xl bg-white/[.06]" />
    </div>
  );
}
