'use client'

import { useRef, useState } from 'react'
import { uploadCsv } from '@/lib/api'
import { UploadResult } from '@/types/job'

interface Props {
  onComplete: () => void
}

export default function CsvUploadButton({ onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await uploadCsv(file)
      setResult(res)
      onComplete()
    } catch {
      setError('Upload failed. Make sure the CSV matches the expected format.')
    } finally {
      setLoading(false)
      // reset so the same file can be re-uploaded if needed
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {(result || error) && !loading && (
        <span className={`text-xs ${error ? 'text-red-500' : 'text-gray-400'} hidden sm:block`}>
          {error || `${result!.created} added · ${result!.updated} updated · ${result!.skipped} unchanged`}
        </span>
      )}
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="border border-gray-300 text-gray-700 text-sm px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Importing...' : <><span className="sm:hidden">CSV</span><span className="hidden sm:inline">Import CSV</span></>}
        </button>
      </div>
    </div>
  )
}