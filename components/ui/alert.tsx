import React from 'react'

interface AlertProps {
  children: React.ReactNode
  className?: string
}

export function Alert({ children, className = '' }: AlertProps) {
  return (
    <div className={`p-4 border border-gray-200 rounded-md bg-gray-50 ${className}`}>
      {children}
    </div>
  )
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm text-gray-700 ${className}`}>
      {children}
    </div>
  )
}