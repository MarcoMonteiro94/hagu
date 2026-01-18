import { Text, View, StyleSheet, Linking, Pressable } from 'react-native'
import { useTheme, spacing, radius, typography } from '@/theme'

// =============================================================================
// Types
// =============================================================================

interface MarkdownRendererProps {
  content: string
  style?: object
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'numbered' | 'checklist' | 'quote' | 'code' | 'divider'
  content: string
  checked?: boolean
  number?: number
}

// =============================================================================
// Markdown Parser
// =============================================================================

function parseMarkdown(text: string): ParsedBlock[] {
  const lines = text.split('\n')
  const blocks: ParsedBlock[] = []
  let numberedCounter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Divider
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'divider', content: '' })
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.slice(2) })
      numberedCounter = 0
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3) })
      numberedCounter = 0
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4) })
      numberedCounter = 0
      continue
    }

    // Bullet list
    if (/^[-*]\s/.test(line)) {
      blocks.push({ type: 'bullet', content: line.slice(2) })
      numberedCounter = 0
      continue
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s(.*)/)
    if (numberedMatch) {
      numberedCounter++
      blocks.push({ type: 'numbered', content: numberedMatch[2], number: numberedCounter })
      continue
    }

    // Checklist
    if (line.startsWith('- [ ] ')) {
      blocks.push({ type: 'checklist', content: line.slice(6), checked: false })
      numberedCounter = 0
      continue
    }
    if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      blocks.push({ type: 'checklist', content: line.slice(6), checked: true })
      numberedCounter = 0
      continue
    }

    // Quote
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', content: line.slice(2) })
      numberedCounter = 0
      continue
    }

    // Code block (simple inline)
    if (line.startsWith('```') || line.startsWith('`')) {
      // For simplicity, treat backtick lines as code
      const content = line.replace(/^`+|`+$/g, '')
      if (content) {
        blocks.push({ type: 'code', content })
      }
      numberedCounter = 0
      continue
    }

    // Empty line
    if (!line.trim()) {
      numberedCounter = 0
      continue
    }

    // Regular paragraph
    blocks.push({ type: 'paragraph', content: line })
    numberedCounter = 0
  }

  return blocks
}

// =============================================================================
// Inline Text Renderer (bold, italic, links)
// =============================================================================

interface InlineTextProps {
  content: string
  baseStyle: object
  boldStyle: object
  italicStyle: object
  linkStyle: object
  codeStyle: object
  codeBackgroundStyle: object
}

function InlineText({
  content,
  baseStyle,
  boldStyle,
  italicStyle,
  linkStyle,
  codeStyle,
  codeBackgroundStyle,
}: InlineTextProps) {
  // Parse inline formatting: **bold**, *italic*, `code`, [link](url)
  const parts: React.ReactNode[] = []
  let remaining = content
  let key = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      parts.push(
        <Text key={key++} style={boldStyle}>
          {boldMatch[1]}
        </Text>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      parts.push(
        <Text key={key++} style={italicStyle}>
          {italicMatch[1]}
        </Text>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Code: `text`
    const codeMatch = remaining.match(/^`(.+?)`/)
    if (codeMatch) {
      parts.push(
        <Text key={key++} style={[codeStyle, codeBackgroundStyle]}>
          {codeMatch[1]}
        </Text>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/)
    if (linkMatch) {
      const text = linkMatch[1]
      const url = linkMatch[2]
      parts.push(
        <Text
          key={key++}
          style={linkStyle}
          onPress={() => Linking.openURL(url)}
        >
          {text}
        </Text>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Regular text - find next special character
    const nextSpecial = remaining.search(/\*|`|\[/)
    if (nextSpecial === -1) {
      parts.push(
        <Text key={key++} style={baseStyle}>
          {remaining}
        </Text>
      )
      break
    } else if (nextSpecial === 0) {
      // No match but at special char, just consume it
      parts.push(
        <Text key={key++} style={baseStyle}>
          {remaining[0]}
        </Text>
      )
      remaining = remaining.slice(1)
    } else {
      parts.push(
        <Text key={key++} style={baseStyle}>
          {remaining.slice(0, nextSpecial)}
        </Text>
      )
      remaining = remaining.slice(nextSpecial)
    }
  }

  return <Text style={baseStyle}>{parts}</Text>
}

// =============================================================================
// Main Component
// =============================================================================

export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  const { colors } = useTheme()

  const blocks = parseMarkdown(content)

  const baseTextStyle = {
    color: colors.foreground,
    fontSize: typography.size.base,
    lineHeight: 24,
  }

  const boldStyle = {
    ...baseTextStyle,
    fontWeight: typography.weight.bold as any,
  }

  const italicStyle = {
    ...baseTextStyle,
    fontStyle: 'italic' as const,
  }

  const linkStyle = {
    ...baseTextStyle,
    color: colors.accent,
    textDecorationLine: 'underline' as const,
  }

  const codeStyle = {
    fontFamily: 'monospace',
    fontSize: typography.size.sm,
    color: colors.foreground,
  }

  const codeBackgroundStyle = {
    backgroundColor: colors.muted,
    paddingHorizontal: 4,
    borderRadius: 4,
  }

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return (
              <Text
                key={index}
                style={[styles.h1, { color: colors.foreground }]}
              >
                {block.content}
              </Text>
            )

          case 'h2':
            return (
              <Text
                key={index}
                style={[styles.h2, { color: colors.foreground }]}
              >
                {block.content}
              </Text>
            )

          case 'h3':
            return (
              <Text
                key={index}
                style={[styles.h3, { color: colors.foreground }]}
              >
                {block.content}
              </Text>
            )

          case 'bullet':
            return (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.bullet, { color: colors.foreground }]}>•</Text>
                <InlineText
                  content={block.content}
                  baseStyle={baseTextStyle}
                  boldStyle={boldStyle}
                  italicStyle={italicStyle}
                  linkStyle={linkStyle}
                  codeStyle={codeStyle}
                  codeBackgroundStyle={codeBackgroundStyle}
                />
              </View>
            )

          case 'numbered':
            return (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.number, { color: colors.foreground }]}>
                  {block.number}.
                </Text>
                <InlineText
                  content={block.content}
                  baseStyle={baseTextStyle}
                  boldStyle={boldStyle}
                  italicStyle={italicStyle}
                  linkStyle={linkStyle}
                  codeStyle={codeStyle}
                  codeBackgroundStyle={codeBackgroundStyle}
                />
              </View>
            )

          case 'checklist':
            return (
              <View key={index} style={styles.listItem}>
                <Text
                  style={[
                    styles.checkbox,
                    { color: block.checked ? colors.success : colors.mutedForeground },
                  ]}
                >
                  {block.checked ? '☑' : '☐'}
                </Text>
                <Text
                  style={[
                    baseTextStyle,
                    block.checked && styles.checkedText,
                    block.checked && { color: colors.mutedForeground },
                  ]}
                >
                  {block.content}
                </Text>
              </View>
            )

          case 'quote':
            return (
              <View
                key={index}
                style={[styles.quote, { borderLeftColor: colors.accent, backgroundColor: colors.muted }]}
              >
                <InlineText
                  content={block.content}
                  baseStyle={{ ...baseTextStyle, fontStyle: 'italic' }}
                  boldStyle={boldStyle}
                  italicStyle={italicStyle}
                  linkStyle={linkStyle}
                  codeStyle={codeStyle}
                  codeBackgroundStyle={codeBackgroundStyle}
                />
              </View>
            )

          case 'code':
            return (
              <View
                key={index}
                style={[styles.codeBlock, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.codeText, { color: colors.foreground }]}>
                  {block.content}
                </Text>
              </View>
            )

          case 'divider':
            return (
              <View
                key={index}
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )

          case 'paragraph':
          default:
            return (
              <View key={index} style={styles.paragraph}>
                <InlineText
                  content={block.content}
                  baseStyle={baseTextStyle}
                  boldStyle={boldStyle}
                  italicStyle={italicStyle}
                  linkStyle={linkStyle}
                  codeStyle={codeStyle}
                  codeBackgroundStyle={codeBackgroundStyle}
                />
              </View>
            )
        }
      })}
    </View>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  h1: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  h2: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  h3: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  paragraph: {
    marginVertical: spacing[1],
  },
  listItem: {
    flexDirection: 'row',
    paddingLeft: spacing[2],
  },
  bullet: {
    width: 20,
    fontSize: typography.size.base,
  },
  number: {
    width: 24,
    fontSize: typography.size.base,
  },
  checkbox: {
    width: 24,
    fontSize: 18,
  },
  checkedText: {
    textDecorationLine: 'line-through',
  },
  quote: {
    paddingLeft: spacing[3],
    paddingVertical: spacing[2],
    paddingRight: spacing[2],
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    marginVertical: spacing[2],
  },
  codeBlock: {
    padding: spacing[3],
    borderRadius: radius.md,
    marginVertical: spacing[2],
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: typography.size.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing[4],
  },
})
