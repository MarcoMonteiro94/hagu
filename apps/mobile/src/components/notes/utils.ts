// =============================================================================
// Types
// =============================================================================

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'bullet'
  | 'numbered'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'link'
  | 'divider'

interface TextSelection {
  start: number
  end: number
}

interface FormatResult {
  content: string
  selection: TextSelection
}

// =============================================================================
// Formatting Functions
// =============================================================================

/**
 * Apply markdown formatting to text content
 */
export function applyFormatting(
  action: FormatAction,
  content: string,
  selection: TextSelection
): FormatResult {
  const { start, end } = selection
  const selectedText = content.slice(start, end)
  const beforeText = content.slice(0, start)
  const afterText = content.slice(end)

  // Check if we're at the start of a line
  const lineStart = beforeText.lastIndexOf('\n') + 1
  const currentLineStart = beforeText.slice(lineStart)

  switch (action) {
    case 'bold': {
      // Wrap selection in **
      const newText = `**${selectedText || 'text'}**`
      return {
        content: beforeText + newText + afterText,
        selection: {
          start: start + 2,
          end: start + 2 + (selectedText.length || 4),
        },
      }
    }

    case 'italic': {
      // Wrap selection in *
      const newText = `*${selectedText || 'text'}*`
      return {
        content: beforeText + newText + afterText,
        selection: {
          start: start + 1,
          end: start + 1 + (selectedText.length || 4),
        },
      }
    }

    case 'h1': {
      // Add # at line start
      if (currentLineStart.startsWith('# ')) {
        // Remove heading
        const newBefore = beforeText.slice(0, lineStart) + currentLineStart.slice(2)
        return {
          content: newBefore + selectedText + afterText,
          selection: { start: start - 2, end: end - 2 },
        }
      }
      const prefix = currentLineStart.length === 0 || beforeText.endsWith('\n') ? '# ' : '\n# '
      return {
        content: beforeText + prefix + selectedText + afterText,
        selection: {
          start: start + prefix.length,
          end: end + prefix.length,
        },
      }
    }

    case 'h2': {
      // Add ## at line start
      if (currentLineStart.startsWith('## ')) {
        // Remove heading
        const newBefore = beforeText.slice(0, lineStart) + currentLineStart.slice(3)
        return {
          content: newBefore + selectedText + afterText,
          selection: { start: start - 3, end: end - 3 },
        }
      }
      const prefix = currentLineStart.length === 0 || beforeText.endsWith('\n') ? '## ' : '\n## '
      return {
        content: beforeText + prefix + selectedText + afterText,
        selection: {
          start: start + prefix.length,
          end: end + prefix.length,
        },
      }
    }

    case 'bullet': {
      // Add - at line start
      const prefix = currentLineStart.length === 0 || beforeText.endsWith('\n') ? '- ' : '\n- '
      return {
        content: beforeText + prefix + selectedText + afterText,
        selection: {
          start: start + prefix.length,
          end: end + prefix.length,
        },
      }
    }

    case 'numbered': {
      // Add 1. at line start
      const prefix = currentLineStart.length === 0 || beforeText.endsWith('\n') ? '1. ' : '\n1. '
      return {
        content: beforeText + prefix + selectedText + afterText,
        selection: {
          start: start + prefix.length,
          end: end + prefix.length,
        },
      }
    }

    case 'checklist': {
      // Add - [ ] at line start
      const prefix = currentLineStart.length === 0 || beforeText.endsWith('\n') ? '- [ ] ' : '\n- [ ] '
      return {
        content: beforeText + prefix + selectedText + afterText,
        selection: {
          start: start + prefix.length,
          end: end + prefix.length,
        },
      }
    }

    case 'quote': {
      // Add > at line start
      const prefix = currentLineStart.length === 0 || beforeText.endsWith('\n') ? '> ' : '\n> '
      return {
        content: beforeText + prefix + selectedText + afterText,
        selection: {
          start: start + prefix.length,
          end: end + prefix.length,
        },
      }
    }

    case 'code': {
      // Wrap in backticks
      const newText = `\`${selectedText || 'code'}\``
      return {
        content: beforeText + newText + afterText,
        selection: {
          start: start + 1,
          end: start + 1 + (selectedText.length || 4),
        },
      }
    }

    case 'link': {
      // Create link format
      const linkText = selectedText || 'link text'
      const newText = `[${linkText}](url)`
      return {
        content: beforeText + newText + afterText,
        selection: {
          start: start + linkText.length + 3,
          end: start + linkText.length + 6,
        },
      }
    }

    case 'divider': {
      // Add horizontal rule
      const prefix = beforeText.endsWith('\n') ? '' : '\n'
      const suffix = afterText.startsWith('\n') ? '' : '\n'
      const divider = `${prefix}---${suffix}`
      return {
        content: beforeText + divider + selectedText + afterText,
        selection: {
          start: start + divider.length,
          end: end + divider.length,
        },
      }
    }

    default:
      return { content, selection }
  }
}

/**
 * Check if current line has a specific format
 */
export function hasLineFormat(content: string, position: number, format: 'h1' | 'h2' | 'bullet' | 'numbered' | 'checklist' | 'quote'): boolean {
  const lineStart = content.lastIndexOf('\n', position - 1) + 1
  const lineContent = content.slice(lineStart, position)

  switch (format) {
    case 'h1':
      return lineContent.startsWith('# ')
    case 'h2':
      return lineContent.startsWith('## ')
    case 'bullet':
      return /^[-*]\s/.test(lineContent)
    case 'numbered':
      return /^\d+\.\s/.test(lineContent)
    case 'checklist':
      return /^- \[[ xX]\]\s/.test(lineContent)
    case 'quote':
      return lineContent.startsWith('> ')
    default:
      return false
  }
}

/**
 * Toggle checklist item status
 */
export function toggleChecklistItem(content: string, position: number): string {
  const lineStart = content.lastIndexOf('\n', position - 1) + 1
  const lineEnd = content.indexOf('\n', position)
  const actualLineEnd = lineEnd === -1 ? content.length : lineEnd

  const line = content.slice(lineStart, actualLineEnd)

  if (line.startsWith('- [ ] ')) {
    // Check it
    return content.slice(0, lineStart) + '- [x] ' + line.slice(6) + content.slice(actualLineEnd)
  } else if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
    // Uncheck it
    return content.slice(0, lineStart) + '- [ ] ' + line.slice(6) + content.slice(actualLineEnd)
  }

  return content
}
