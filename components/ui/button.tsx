import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
}

export function Button({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-blue-500'
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}