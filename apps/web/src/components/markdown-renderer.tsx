import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked for GFM + line breaks
marked.setOptions({ breaks: true, gfm: true })

interface Props {
  content: string
  compact?: boolean
  className?: string
}

export function MarkdownRenderer({ content, compact, className }: Props) {
  const html = useMemo(() => {
    if (!content) return ''
    const raw = marked.parse(content, { async: false }) as string
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
        'h4', 'h5', 'h6', 'code', 'pre', 'blockquote', 'hr', 'del', 'table',
        'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
  }, [content])

  if (!html) return null

  return (
    <div
      className={`markdown-content ${compact ? 'markdown-compact' : ''} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
