'use client'

import { useState } from 'react'

type PasswordInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  id?: string
  className?: string
}

const INPUT_CLASS =
  'w-full border-2 border-gray-300 rounded-md px-3 py-2 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] disabled:bg-gray-100 disabled:cursor-not-allowed'

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  autoComplete = 'current-password',
  onKeyDown,
  id,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
        className={className ?? INPUT_CLASS}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M1 1l22 22" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
