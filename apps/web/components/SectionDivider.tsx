export function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 my-10">
      <div className="relative h-[1px] bg-neutral-200">
        {label && (
          <span className="absolute -top-3 left-4 bg-neutral-50 px-2 text-xs text-neutral-500">{label}</span>
        )}
      </div>
    </div>
  );
}




