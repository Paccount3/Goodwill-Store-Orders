'use client'

import React from 'react'
import {
  renderAnnouncementLine,
  isBulletBlock,
  isNumberedBlock,
} from '@/lib/announcement-formatting'

export function AnnouncementBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="space-y-4 text-sm leading-relaxed text-gray-700">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)

        if (isBulletBlock(lines)) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderAnnouncementLine(line, `${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          )
        }

        if (isNumberedBlock(lines)) {
          return (
            <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderAnnouncementLine(line, `${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ol>
          )
        }

        if (lines.length === 1) {
          return (
            <p key={blockIndex}>
              {renderAnnouncementLine(lines[0], `${blockIndex}-0`)}
            </p>
          )
        }

        return (
          <div key={blockIndex} className="space-y-1">
            {lines.map((line, lineIndex) => (
              <p key={lineIndex}>
                {renderAnnouncementLine(line, `${blockIndex}-${lineIndex}`)}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}
