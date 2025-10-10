'use client'

import { useState } from 'react'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
}

export default function Dropdown({ options, value, onChange, placeholder, disabled = false }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-white border rounded-lg px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-accentBlue/40 focus:border-accentBlue transition-all duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed border-gray-300' : 'border-[#A9D0FF] hover:border-accentBlue'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-accentBlue transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#A9D0FF] rounded-lg shadow-lg max-h-60 overflow-auto animate-slide-up">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-primary-50 focus:outline-none focus:bg-primary-50 transition-colors duration-150 ${
                option.value === value ? 'bg-primary-100 text-[#1E66AD]' : 'text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && !disabled && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
