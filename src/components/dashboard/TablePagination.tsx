import { cn } from '@/lib/utils'

interface TablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({ page, totalPages, onPageChange, className }: TablePaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1)

  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1 text-[14px] text-neutral-500 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={cn(
            'flex size-9 items-center justify-center rounded-full text-[14px] font-medium transition-colors',
            pageNumber === page
              ? 'bg-primary text-white'
              : 'border border-primary text-primary hover:bg-[#e8edfc]'
          )}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1 text-[14px] text-neutral-500 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
