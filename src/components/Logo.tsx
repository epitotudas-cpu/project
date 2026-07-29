export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { helmet: 28, text: 'text-lg', slogan: 'text-[10px]' },
    md: { helmet: 40, text: 'text-2xl', slogan: 'text-xs' },
    lg: { helmet: 56, text: 'text-4xl', slogan: 'text-sm' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <svg width={s.helmet} height={s.helmet} viewBox="0 0 40 40" fill="none">
        <path d="M4 28h32v4H4z" fill="#FFC400" />
        <path d="M20 6C12 6 6 12 6 20v8h28v-8C34 12 28 6 20 6z" fill="#FFC400" />
        <path d="M20 6C12 6 6 12 6 20v4h28v-4C34 12 28 6 20 6z" fill="#E6B000" />
        <path d="M16 10v10h8V10" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="24" width="24" height="4" rx="1" fill="#CC9900" />
        <path d="M12 14c0-4.4 3.6-8 8-8" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.3" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight text-white ${s.text}`}>
          Építő<span className="text-[#FFC400]">Tudás</span>
        </span>
        <span className={`text-gray-400 font-medium mt-0.5 ${s.slogan}`}>
          A jó munka a tudással kezdődik.
        </span>
      </div>
    </div>
  );
}
