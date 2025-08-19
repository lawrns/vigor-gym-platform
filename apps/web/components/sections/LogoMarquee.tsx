import Image from 'next/image';

export function LogoMarquee({ title, logos }: { title?: string; logos: string[] }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      {title && <div className="text-center text-sm text-muted">{title}</div>}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-6 items-center opacity-80">
        {logos.map((src, i) => (
          <div key={i} className="flex justify-center">
            <Image
              src={src}
              alt=""
              aria-hidden
              width={120}
              height={40}
              className="rounded-md object-cover opacity-75"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
