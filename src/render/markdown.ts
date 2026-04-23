const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** minimal markdown-to-html for server rendering (bold, italic, links, lists, paragraphs) */
export const renderMarkdown = (source: string): string => {
  const lines = source.split('\n')
  const output: string[] = []
  let inList = false

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { output.push('<ul>'); inList = true }
      output.push(`<li>${inlineFormat(line.slice(2))}</li>`)
      continue
    }

    if (inList) { output.push('</ul>'); inList = false }

    if (line.trim() === '') {
      continue
    }

    if (line.startsWith('### ')) {
      output.push(`<h3>${inlineFormat(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      output.push(`<h2>${inlineFormat(line.slice(3))}</h2>`)
    } else if (line.startsWith('# ')) {
      output.push(`<h1>${inlineFormat(line.slice(2))}</h1>`)
    } else {
      output.push(`<p>${inlineFormat(line)}</p>`)
    }
  }

  if (inList) output.push('</ul>')
  return output.join('\n')
}

const inlineFormat = (text: string): string => {
  let result = escapeHtml(text)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')
  return result
}
