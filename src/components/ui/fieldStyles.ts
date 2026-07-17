import { cn } from '@/lib/utils'

/**
 * Shared field styling tokens used across every form in the app (auth,
 * dashboard, company profile, entity data). Keep visual field definitions here
 * so components — not scattered call sites — are the single source of truth.
 */

export const fieldTextClassName = 'field-text text-[16px] leading-[1.6]'
export const fieldBodyTextClassName = 'text-body-compact leading-[1.6]'
export const fieldTitleClassName = 'field-card-title'
export const fieldLabelClassName = 'field-label text-neutral-900'
export const questionLabelClassName = fieldLabelClassName
export const fieldHeightClassName = 'h-12'

// Placeholder + inner text styling shared by the plain input and the
// icon/adornment variant (where the border lives on the wrapper, not the input).
export const fieldPlaceholderClassName =
  'placeholder:text-[16px] placeholder:font-light placeholder:leading-[1.6] placeholder:text-neutral-500'
export const fieldInputTextClassName = cn(
  fieldTextClassName,
  'font-normal text-neutral-900',
  fieldPlaceholderClassName
)

export const fieldInputClassName = cn(
  fieldInputTextClassName,
  'w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
)
export const fieldTextareaClassName = cn(fieldInputClassName, 'min-h-[134px] resize-none py-2.5')

// Native <select> styling (auth selects, country pickers). Native selects have
// no placeholder pseudo-element, so the empty state is expressed by text color.
export const nativeSelectBaseClassName = cn(
  fieldTextClassName,
  'w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white',
  fieldHeightClassName,
  'px-4 appearance-none cursor-pointer font-sans font-light',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50'
)
export function nativeSelectClassName(hasValue: boolean) {
  return cn(nativeSelectBaseClassName, hasValue ? 'text-neutral-900' : 'text-neutral-500')
}

export const formSectionClassName =
  'space-y-5 rounded-[var(--radius-md)] border border-[#ececec] bg-[rgba(102,102,102,0.04)] p-5'
export const fieldActionButtonClassName =
  'min-w-[200px] rounded-[var(--radius-sm)] disabled:opacity-50'
export const fieldStandardTabClassName =
  'field-standard-tab rounded-[var(--radius-sm)] px-4 py-2 transition-colors'
export const fieldStandardTabActiveClassName = 'bg-white text-primary shadow-sm'
export const fieldStandardTabInactiveClassName = 'text-neutral-600'
