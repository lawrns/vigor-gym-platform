import Image from 'next/image';
import { Icons } from '../../lib/icons/registry';
import { Stack } from '../primitives/Stack';

// Static imports for reliable logo loading
import logo1Image from '@/public/images/logo-1.webp';
import logo1Svg from '@/public/images/logo1.svg';
import logo2Png from '@/public/images/logo2.png';

type KPIItem = {
  icon: keyof typeof Icons;
  label: string;
  value: number;
  suffix?: string;
  animate?: boolean;
};

type KPIStatsWithLogosProps = {
  kpiItems: KPIItem[];
  logoTitle?: string;
  logos: string[];
};

export function KPIStatsWithLogos({ kpiItems, logoTitle, logos }: KPIStatsWithLogosProps) {
  return (
    <Stack gap="12">
      {/* KPI Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiItems.map(item => {
          const Icon = (Icons as any)[item.icon] || Icons.Activity;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">{item.label}</div>
              </div>
              <div className="mt-2 font-bold text-2xl text-gray-900 dark:text-white">
                {Intl.NumberFormat('es-MX').format(item.value)}
                {item.suffix || ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Logo Marquee Section */}
      <div className="text-center">
        {logoTitle && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {logoTitle}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center opacity-80">
          {logos.map((src, i) => {
            // Use logo1.svg and logo2.png alternately (2 times each for 4 total)
            const getLogoSrc = () => {
              if (src === 'static-import' || src.startsWith('/images/')) {
                const logoIndex = i % 2;
                return logoIndex === 0 ? logo1Svg : logo2Png;
              }
              return src;
            };

            return (
              <div key={i} className="flex justify-center">
                <Image
                  src={getLogoSrc()}
                  alt=""
                  aria-hidden
                  width={120}
                  height={40}
                  className="rounded-md object-contain opacity-75 hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            );
          })}
        </div>
      </div>
    </Stack>
  );
}
