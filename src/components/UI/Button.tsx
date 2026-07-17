import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles = [
    'relative inline-flex items-center justify-center font-medium rounded-md transition-all duration-fast ease-standard',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'active:scale-[0.97]',
  ]

  const variantStyles = {
    primary: [
      'bg-primary-600 text-white',
      'hover:bg-primary-700',
      'active:bg-primary-800',
      'disabled:bg-neutral-300 disabled:cursor-not-allowed',
    ],
    secondary: [
      'bg-white text-primary-700 border border-primary-300',
      'hover:bg-primary-50 hover:border-primary-400',
      'active:bg-primary-100',
      'disabled:border-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed',
    ],
    ghost: [
      'bg-transparent text-neutral-700',
      'hover:bg-neutral-100',
      'active:bg-neutral-200',
      'disabled:text-neutral-400 disabled:cursor-not-allowed',
    ],
    danger: [
      'bg-danger-500 text-white',
      'hover:bg-danger-600',
      'active:bg-danger-700',
      'disabled:bg-neutral-300 disabled:cursor-not-allowed',
    ],
  }

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        ...baseStyles,
        ...variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-40 cursor-not-allowed',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'inline-flex items-center justify-center'}>
        {children}
      </span>
    </button>
  )
}
