import {
  FormField,
  fieldInputClassName,
  fieldHeightClassName,
} from '@/components/dashboard/FormField'
import { cn } from '@/lib/utils'
import { GoogleMapIcon } from './Primitives'

interface GoogleMapUrlFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function GoogleMapUrlField({
  label,
  placeholder,
  value,
  onChange,
  required,
}: GoogleMapUrlFieldProps) {
  return (
    <FormField label={label} required={required}>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute start-3">
          <GoogleMapIcon />
        </span>
        <input
          type="url"
          dir="ltr"
          placeholder={placeholder}
          className={cn(fieldInputClassName, fieldHeightClassName, 'ps-10')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </FormField>
  )
}
