'use client'

import { useRef, useState, useEffect } from 'react'
import { uploadCsv } from '@/lib/api'

interface Props {
  onComplete: () => void
  label?: string
  className?: string
}

export default function CsvUploadButton({ onComplete, label, className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setToast(null)

    try {
      const res = await uploadCsv(file)
      setToast({
        type: 'success',
        message: `${res.created} added · ${res.updated} updated · ${res.skipped} unchanged`,
      })
      onComplete()
    } catch {
      setToast({ type: 'error', message: 'Import failed. Check the CSV format.' })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={`w-full sm:w-auto text-center border border-sky-300 bg-sky-50 text-sky-700 text-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-sky-100 disabled:opacity-50 transition-colors whitespace-nowrap ${className}`}
      >
        {loading ? 'Importing...' : (
          label ? label : (
            <>
              <span className="sm:hidden">CSV</span>
              <span className="hidden sm:inline">Import CSV</span>
            </>
          )
        )}
      </button>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium transition-all whitespace-nowrap ${toast.type === 'success'
          ? 'bg-gray-900 text-white'
          : 'bg-red-500 text-white'
          }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}