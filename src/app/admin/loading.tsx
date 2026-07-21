export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6 md:p-8">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-sbc-gray-light/80" />
        <div className="h-4 w-72 max-w-full rounded bg-sbc-gray-light/50" />
      </div>
      <div className="flex gap-2 border-b border-sbc-gray-light pb-px">
        <div className="h-9 w-28 rounded-t bg-sbc-gray-light/70" />
        <div className="h-9 w-20 rounded-t bg-sbc-gray-light/40" />
        <div className="h-9 w-16 rounded-t bg-sbc-gray-light/40" />
      </div>
      <div className="h-64 rounded-lg border border-sbc-gray-light/80 bg-sbc-gray-light/30" />
    </div>
  );
}
