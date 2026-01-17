'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'
import type { Block } from '@blocknote/core'

interface PageEditorProps {
  initialContent?: Block[]
  onChange?: (content: Block[]) => void
  editable?: boolean
}

export function PageEditor({
  initialContent,
  onChange,
  editable = true,
}: PageEditorProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
  })

  const handleChange = useCallback(() => {
    if (onChange) {
      onChange(editor.document)
    }
  }, [editor, onChange])

  if (!mounted) {
    return (
      <div className="min-h-[500px] rounded-xl bg-muted/30 animate-pulse" />
    )
  }

  return (
    <div className="page-editor-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      />
      <style jsx global>{`
        .page-editor-wrapper .bn-container {
          --bn-colors-editor-background: transparent;
          --bn-colors-editor-text: hsl(var(--foreground));
          --bn-colors-menu-background: hsl(var(--popover));
          --bn-colors-menu-text: hsl(var(--popover-foreground));
          --bn-colors-hovered-background: hsl(var(--accent));
          --bn-colors-selected-background: hsl(var(--accent));
          --bn-colors-disabled-background: hsl(var(--muted));
          --bn-colors-border: hsl(var(--border));
          --bn-colors-side-menu: hsl(var(--muted-foreground));
          --bn-colors-highlights-gray-background: hsl(var(--muted));
          --bn-colors-highlights-gray-text: hsl(var(--muted-foreground));
          min-height: 500px;
        }
        .page-editor-wrapper .bn-editor {
          padding: 0;
          color: hsl(var(--foreground));
        }
        .page-editor-wrapper .bn-block-group {
          padding: 0;
        }
        .page-editor-wrapper [data-content-type="paragraph"],
        .page-editor-wrapper [data-content-type="heading"],
        .page-editor-wrapper [data-content-type="bulletListItem"],
        .page-editor-wrapper [data-content-type="numberedListItem"],
        .page-editor-wrapper [data-content-type="checkListItem"] {
          color: hsl(var(--foreground));
        }
        .page-editor-wrapper [data-content-type="paragraph"] {
          font-size: 1rem;
          line-height: 1.75;
        }
        .page-editor-wrapper .bn-inline-content {
          color: hsl(var(--foreground));
        }
        .page-editor-wrapper [data-placeholder]::before {
          color: hsl(var(--muted-foreground) / 0.6);
        }
      `}</style>
    </div>
  )
}
