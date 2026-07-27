'use client'

import { useRef, useState } from 'react'
import {
  ANNOUNCEMENT_FORMATTING_HELP,
  wrapAnnouncementSelection,
} from '@/lib/announcement-formatting'

interface AnnouncementBodyEditorProps {
  body: string
  onChange: (body: string) => void
}

const TOOLBAR_BUTTON_CLASS =
  'rounded-md border-2 border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0066CC]'

export function AnnouncementBodyEditor({ body, onChange }: AnnouncementBodyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  const applyWrap = (wrapper: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { nextText, selectionStart, selectionEnd } = wrapAnnouncementSelection(
      body,
      textarea.selectionStart,
      textarea.selectionEnd,
      wrapper
    )

    onChange(nextText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyWrap('**')}
          className={`${TOOLBAR_BUTTON_CLASS} font-bold`}
          title="Bold (**text**)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyWrap('*')}
          className={`${TOOLBAR_BUTTON_CLASS} italic`}
          title="Italic (*text*)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => applyWrap('__')}
          className={`${TOOLBAR_BUTTON_CLASS} underline`}
          title="Underline (__text__)"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => setGuideOpen((open) => !open)}
          className={`${TOOLBAR_BUTTON_CLASS} text-xs font-semibold`}
          aria-expanded={guideOpen}
        >
          {guideOpen ? 'Hide formatting guide' : 'Formatting guide'}
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
        placeholder="Announcement message..."
        spellCheck
      />

      {guideOpen && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Formatting guide
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ANNOUNCEMENT_FORMATTING_HELP.map((item) => (
              <div key={item.label} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-900">{item.label}</span>
                  <code className="text-[11px] font-mono text-[#0066CC]">{item.syntax}</code>
                </div>
                <p className="text-xs text-gray-600">{item.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
