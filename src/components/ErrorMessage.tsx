'use client'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  showRetry?: boolean
}

export default function ErrorMessage({ message, onRetry, showRetry = true }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
      <p className="text-red-700 mb-4">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
