import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-[var(--radius-default)] text-[16px] font-semibold',
    'transition-colors duration-150',
    'cursor-pointer disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary !text-white',
          'hover:bg-primary-hover',
          'active:bg-primary-active',
          'disabled:bg-blue-200 disabled:!text-white disabled:opacity-100',
        ].join(' '),
        secondary: [
          'bg-white text-blue-500 border border-blue-500',
          'hover:bg-blue-50',
          'active:bg-blue-100',
          'disabled:bg-white disabled:text-blue-200 disabled:border-blue-200',
        ].join(' '),
        tertiary: [
          'bg-transparent text-blue-500',
          'hover:text-blue-600',
          'active:text-blue-700',
          'disabled:text-blue-200',
        ].join(' '),
        destructive: [
          'bg-error-500 !text-white',
          'hover:bg-error-400',
          'active:bg-error-700',
          'disabled:bg-error-200 disabled:!text-white disabled:opacity-100',
        ].join(' '),
        link: 'bg-transparent text-blue-500 underline-offset-4 hover:text-blue-600 hover:underline p-0 h-auto',
        outline: [
          'bg-white text-blue-500 border border-blue-500',
          'hover:bg-blue-50',
          'active:bg-blue-100',
          'disabled:bg-white disabled:text-blue-200 disabled:border-blue-200',
        ].join(' '),
      },
      size: {
        default: 'h-12 px-4',
        sm: 'h-8 px-3 text-small-medium',
        lg: 'h-12 px-6',
        icon: 'h-12 w-12 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  iconPosition = 'start',
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const isIconOnly = size === 'icon' || size === 'icon-sm'

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {icon && iconPosition === 'start' && (
        <span className="shrink-0 [&_svg]:rtl-flip">{icon}</span>
      )}
      {!isIconOnly && children}
      {isIconOnly && (icon ?? children)}
      {icon && iconPosition === 'end' && (
        <span className="shrink-0 [&_svg]:rtl-flip">{icon}</span>
      )}
    </Comp>
  )
}

export { buttonVariants }
