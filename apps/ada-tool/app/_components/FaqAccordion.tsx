'use client'

import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div>
      {items.map(({ q, a }, i) => {
        const isOpen = open === i
        return (
          <div
            key={q}
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '8px',
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
            }}
          >
            <button
              className="faq-q"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                fontWeight: 600,
                fontSize: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span>{q}</span>
              <span
                className={`faq-chevron${isOpen ? ' open' : ''}`}
                aria-hidden="true"
                style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}
              >
                ▼
              </span>
            </button>
            {isOpen && (
              <div
                style={{
                  padding: '0 24px 20px',
                  color: 'var(--text-secondary)',
                  fontSize: '15px',
                  lineHeight: 1.7,
                }}
              >
                {a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
