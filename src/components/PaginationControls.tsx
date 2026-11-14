import { useState, useEffect, useMemo } from 'react';

export function usePagination<T>(items: T[], perPage = 24, resetKey?: string) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, safePage, perPage]);

  return {
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    paginatedItems,
  };
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

/**
 * Shared pagination bar for public listing pages.
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemLabel = 'elem',
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0 || totalPages <= 1) return null;

  const goTo = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200/80 flex-wrap">
      <span className="text-xs font-medium text-gray-500">
        {currentPage}. oldal / {totalPages} ({totalItems} {itemLabel})
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => goTo(Math.max(1, currentPage - 1))}
          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Előző
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => goTo(Math.min(totalPages, currentPage + 1))}
          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Következő
        </button>
      </div>
    </div>
  );
}
