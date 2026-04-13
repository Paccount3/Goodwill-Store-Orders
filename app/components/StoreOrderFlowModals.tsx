'use client'

import { useState } from 'react'
import { CONFIRM_ORDER_MODAL_BODY } from '@/lib/order-flow'

type ConfirmModalProps = {
  open: boolean
  password: string
  passwordError: string
  submitting: boolean
  onPasswordChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmOrderModal({
  open,
  password,
  passwordError,
  submitting,
  onPasswordChange,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0066CC] mb-4">Confirm Order Submission</h2>
          <p className="text-gray-700 mb-6">{CONFIRM_ORDER_MODAL_BODY}</p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2 text-left">
              Order submission password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter password"
              className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm()
              }}
            />
            {passwordError && (
              <p className="text-red-600 text-sm mt-1 text-left">{passwordError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type ErrorModalProps = {
  open: boolean
  message: string
  onClose: () => void
}

export function OrderSubmitErrorModal({ open, message, onClose }: ErrorModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-red-700 mb-3">Order could not be submitted</h2>
        <p className="text-gray-800 text-sm whitespace-pre-wrap mb-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold py-3 px-4 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

type SuccessModalProps = {
  open: boolean
  orderId: number
  /** e.g. "01 - Main Store" */
  storeDisplay: string
  /** e.g. "Store Supply Order" */
  orderTypeLabel: string
  onOrderAgain: () => void
  onPrintCopy: () => void
}

/** Single line for email subject / header — store + order # + order type. */
function buildEmailHeaderLine(orderId: number, storeDisplay: string, orderTypeLabel: string): string {
  const trimmedStore = storeDisplay?.trim()
  if (!trimmedStore) {
    return `Order #${orderId} — ${orderTypeLabel}`
  }
  return `Order #${orderId} — ${trimmedStore} — ${orderTypeLabel}`
}

export function OrderSuccessModal({
  open,
  orderId,
  storeDisplay,
  orderTypeLabel,
  onOrderAgain,
  onPrintCopy,
}: SuccessModalProps) {
  const [copied, setCopied] = useState(false)
  if (!open) return null

  const emailHeaderLine = buildEmailHeaderLine(orderId, storeDisplay, orderTypeLabel)

  const copyHeader = async () => {
    try {
      await navigator.clipboard.writeText(emailHeaderLine)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select input if clipboard blocked
      const el = document.getElementById('order-success-email-header') as HTMLInputElement | null
      el?.select()
      el?.setSelectionRange(0, 99999)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 my-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0066CC] mb-3">Order Submitted Successfully</h2>

          <div className="rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-left text-sm text-gray-900 mb-4">
            <p className="font-semibold text-gray-900">NEXT STEPS:</p>
            <p className="mt-2">
              You must send an email to our fulfillment team. Email: <span className="font-semibold">Michael Segura - Msegura@gwct.org</span>.
              You may copy the title below for your email and save a copy.
            </p>
          </div>

          <div className="text-left mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="order-success-email-header">
              Copy for email subject / header
            </label>
            <div className="flex gap-2">
              <input
                id="order-success-email-header"
                readOnly
                value={emailHeaderLine}
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 border-2 border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
              <button
                type="button"
                onClick={copyHeader}
                className="shrink-0 bg-[#0066CC] hover:bg-[#0052A3] text-white font-semibold px-3 py-2 rounded-md text-sm transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Includes store name and order number for your message header.</p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Please reach out to our fulfillment team for any issues or delays.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900 mb-2">What would you like to do next?</p>

            <button
              type="button"
              onClick={onOrderAgain}
              className="w-full bg-white border-2 border-[#0066CC] text-[#0066CC] font-bold py-3 px-4 rounded-lg hover:bg-[#0066CC] hover:text-white transition shadow-md"
            >
              Close / Order Again
            </button>

            <button
              type="button"
              onClick={onPrintCopy}
              className="w-full bg-white border-2 border-[#0066CC] text-[#0066CC] font-bold py-3 px-4 rounded-lg hover:bg-[#0066CC] hover:text-white transition shadow-md"
            >
              Print a copy of order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderLoadingModal({ open }: { open: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0066CC] border-t-transparent" />
          </div>
          <p className="text-lg font-semibold text-gray-900">Processing your order...</p>
        </div>
      </div>
    </div>
  )
}
