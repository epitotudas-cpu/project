import { useSiteSettings } from '../services/siteSettingsService';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const siteSettings = useSiteSettings();
  const logoUrl = siteSettings.logoUrl || '/logo.png';

  const sizes = {
    sm: { height: 'h-7 max-h-7', text: 'text-lg', slogan: 'text-[10px]' },
    md: { height: 'h-10 max-h-10', text: 'text-2xl', slogan: 'text-xs' },
    lg: { height: 'h-14 max-h-14', text: 'text-4xl', slogan: 'text-sm' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3 shrink-0">
      <img
        src={logoUrl}
        alt="ÉpítőTudás"
        className={`${s.height} max-w-[220px] w-auto object-contain shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.png';
        }}
      />
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight text-white ${s.text}`}>
          {siteSettings.siteTitle === 'ÉpítőTudás' ? (
            <>
              Építő<span className="text-[#FFC400]">Tudás</span>
            </>
          ) : (
            siteSettings.siteTitle
          )}
        </span>
        <span className={`text-gray-400 font-medium mt-0.5 ${s.slogan}`}>
          {siteSettings.tagline || 'Építőipari tudásbázis'}
        </span>
      </div>
    </div>
  );
}
