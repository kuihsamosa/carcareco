'use client'

import { useState, useEffect, useRef } from 'react'

const CORRECT_PIN = process.env.NEXT_PUBLIC_SALES_PIN ?? ''

export default function SalesPinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (CORRECT_PIN.length > 0 && pin.length === CORRECT_PIN.length) {
      if (pin === CORRECT_PIN) {
        setUnlocked(true)
      } else {
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setPin('')
          inputRef.current?.focus()
        }, 500)
      }
    }
  }, [pin])

  if (unlocked) return <>{children}</>

  if (!CORRECT_PIN) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <p className="text-red-500 text-sm">Sales PIN not configured (NEXT_PUBLIC_SALES_PIN missing).</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Sales Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your PIN to continue</p>
        </div>

        <div className={`flex gap-3 ${shake ? 'animate-shake' : ''}`}>
          {Array.from({ length: CORRECT_PIN.length }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length
                  ? 'bg-gray-800 border-gray-800'
                  : 'bg-white border-gray-300'
              }`}
            />
          ))}
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={CORRECT_PIN.length}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          className="opacity-0 absolute w-0 h-0"
          autoComplete="off"
        />

        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button
              key={n}
              onClick={() => setPin(p => p.length < CORRECT_PIN.length ? p + n : p)}
              className="w-16 h-16 rounded-full text-xl font-medium text-gray-800 bg-white border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => setPin(p => p.length < CORRECT_PIN.length ? p + '0' : p)}
            className="w-16 h-16 rounded-full text-xl font-medium text-gray-800 bg-white border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => setPin(p => p.slice(0, -1))}
            className="w-16 h-16 rounded-full text-xl font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm"
          >
            ⌫
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
