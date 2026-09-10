import { ReactNode } from 'react';

export interface SubNavItem {
  label: string;
  page?: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
}

interface SectionSubNavProps {
  ariaLabel: string;
  items: SubNavItem[];
  onNavigate?: (page: string) => void;
}

export default function SectionSubNav({ ariaLabel, items, onNavigate }: SectionSubNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-[57px] z-40 bg-primary-800/95 backdrop-blur-md border-b border-primary-700 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none no-scrollbar touch-pan-x min-w-0 pr-6">
        {items.map((item, index) => {
          const content = (
            <>
              {item.icon && <span className="shrink-0 flex items-center">{item.icon}</span>}
              <span className="shrink-0 whitespace-nowrap">{item.label}</span>
            </>
          );

          const className = `shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer select-none ${
            item.active
              ? 'text-accent bg-accent/10 font-bold border border-accent/20 shadow-xs'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`;

          if (item.href) {
            return (
              <a key={index} href={item.href} className={className}>
                {content}
              </a>
            );
          }

          return (
            <button
              key={index}
              onClick={() => item.page && onNavigate && onNavigate(item.page)}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
