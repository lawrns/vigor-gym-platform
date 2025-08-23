import Image from 'next/image';

// Static imports for reliable logo loading
import logo1Image from '@/public/images/logo-1.webp';
import logo1Svg from '@/public/images/logo1.svg';
import logo2Png from '@/public/images/logo2.png';

export function LogoMarquee({ title, logos }: { title?: string; logos: string[] }) {
  // Map logo sources to imported images
  const getLogoSrc = (src: string, index: number) => {
    if (src === 'static-import' || src.startsWith('/images/')) {
      // Use logo1.svg and logo2.png alternately (2 times each for 4 total)
      const logoIndex = index % 2;
      return logoIndex === 0 ? logo1Svg : logo2Png;
    }
    return src;
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      {title && <div className="text-center text-sm text-muted">{title}</div>}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-6 items-center opacity-80">
        {logos.map((src, i) => (
          <div key={i} className="flex justify-center">
            <Image
              src={getLogoSrc(src, i)}
              alt=""
              aria-hidden
              width={120}
              height={40}
              className="rounded-md object-contain opacity-75 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
