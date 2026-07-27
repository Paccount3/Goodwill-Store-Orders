import React from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\d{3}-\d{3}-\d{4}$/
const BULLET_REGEX = /^[-*]\s+(.+)$/
const NUMBERED_REGEX = /^\d+\.\s+(.+)$/

export const ANNOUNCEMENT_FORMATTING_HELP = [
  { syntax: '**text**', label: 'Bold', example: '**North Region Specialist**' },
  { syntax: '*text*', label: 'Italic', example: '*Please note:* contact your specialist first' },
  { syntax: '__text__', label: 'Underline', example: '__Important deadline: Friday__' },
  { syntax: '- item', label: 'Bullet list', example: 'Start each line with - and a space' },
  { syntax: '1. item', label: 'Numbered list', example: 'Start lines with 1. 2. 3.' },
  { syntax: '(blank line)', label: 'New paragraph', example: 'Leave an empty line between sections' },
  { syntax: 'email@domain.org', label: 'Email link', example: 'Auto-linked when on its own line' },
  { syntax: '203-555-0100', label: 'Phone link', example: 'Auto-linked when on its own line' },
] as const

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'underline'; value: string }

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let i = 0

  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        tokens.push({ type: 'bold', value: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }

    if (text.startsWith('__', i)) {
      const end = text.indexOf('__', i + 2)
      if (end !== -1) {
        tokens.push({ type: 'underline', value: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }

    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1 && text[end + 1] !== '*') {
        tokens.push({ type: 'italic', value: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    let j = i + 1
    while (j < text.length) {
      if (text.startsWith('**', j) || text.startsWith('__', j)) break
      if (text[j] === '*' && text[j + 1] !== '*') break
      j++
    }

    tokens.push({ type: 'text', value: text.slice(i, j) })
    i = j
  }

  return tokens
}

function renderInlineTokens(tokens: InlineToken[], keyPrefix: string): React.ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`

    if (token.type === 'bold') {
      return React.createElement(
        'strong',
        { key, className: 'font-semibold text-gray-900' },
        ...renderInlineTokens(tokenizeInline(token.value), `${key}-b`)
      )
    }

    if (token.type === 'italic') {
      return React.createElement(
        'em',
        { key, className: 'italic' },
        ...renderInlineTokens(tokenizeInline(token.value), `${key}-i`)
      )
    }

    if (token.type === 'underline') {
      return React.createElement(
        'span',
        { key, className: 'underline' },
        ...renderInlineTokens(tokenizeInline(token.value), `${key}-u`)
      )
    }

    return React.createElement('span', { key }, token.value)
  })
}

export function parseAnnouncementInline(text: string, keyPrefix = 'inline'): React.ReactNode[] {
  return renderInlineTokens(tokenizeInline(text), keyPrefix)
}

export function renderAnnouncementLine(line: string, key: string): React.ReactNode {
  const trimmed = line.trim()
  if (!trimmed) return null

  if (EMAIL_REGEX.test(trimmed)) {
    return React.createElement(
      'a',
      {
        key,
        href: `mailto:${trimmed}`,
        className: 'text-[#0066CC] hover:underline',
      },
      trimmed
    )
  }

  if (PHONE_REGEX.test(trimmed)) {
    return React.createElement(
      'a',
      {
        key,
        href: `tel:${trimmed.replace(/-/g, '')}`,
        className: 'text-gray-700 hover:text-[#0066CC] tabular-nums',
      },
      trimmed
    )
  }

  const bulletMatch = trimmed.match(BULLET_REGEX)
  if (bulletMatch) {
    return React.createElement(
      'span',
      { key },
      ...parseAnnouncementInline(bulletMatch[1], `${key}-bullet`)
    )
  }

  const numberedMatch = trimmed.match(NUMBERED_REGEX)
  if (numberedMatch) {
    return React.createElement(
      'span',
      { key },
      ...parseAnnouncementInline(numberedMatch[1], `${key}-num`)
    )
  }

  return React.createElement('span', { key }, ...parseAnnouncementInline(trimmed, key))
}

export function isBulletBlock(lines: string[]): boolean {
  return lines.length > 0 && lines.every((line) => BULLET_REGEX.test(line.trim()))
}

export function isNumberedBlock(lines: string[]): boolean {
  return lines.length > 0 && lines.every((line) => NUMBERED_REGEX.test(line.trim()))
}

export function wrapAnnouncementSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string
): { nextText: string; selectionStart: number; selectionEnd: number } {
  const selected = text.slice(selectionStart, selectionEnd)
  const wrapped = `${wrapper}${selected}${wrapper}`
  const nextText = text.slice(0, selectionStart) + wrapped + text.slice(selectionEnd)
  const cursorStart = selectionStart + wrapper.length
  const cursorEnd = cursorStart + selected.length
  return { nextText, selectionStart: cursorStart, selectionEnd: cursorEnd }
}
