export function Statistic({ value, label, detail }: { value: string | number; label: string; detail: string }) {
  return (
    <div className="flex h-full flex-col justify-between border-b border-r border-surface-container-highest p-5 transition-colors hover:bg-surface-container-low/60 sm:p-6">
      <div>
        <p className={`whitespace-nowrap font-headline font-normal leading-none tracking-tight text-on-surface ${String(value).length > 8 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>{value}</p>
        <p className="mt-3 text-xs font-semibold tracking-wide text-on-surface">{label}</p>
      </div>
      <p className="mt-2 text-[10px] uppercase leading-relaxed tracking-wider text-secondary sm:text-[11px]">{detail}</p>
    </div>
  );
}
