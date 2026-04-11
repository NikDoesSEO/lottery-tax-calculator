// Strip basic markdown formatting to produce plain text suitable for
// JSON-LD fields, meta descriptions, and other non-HTML contexts.
// This is intentionally simple and NOT a full markdown parser — it handles
// the subset of markdown we actually use in FAQ and guide content.
export function markdownToPlainText(md: string): string {
  return md
    // Remove fenced code blocks first so inline rules don't mangle them
    .replace(/```[\s\S]*?```/g, '')
    // Inline code
    .replace(/`([^`]*)`/g, '$1')
    // Images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Bold **x** / __x__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Italic *x* / _x_
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\b_([^_]+)_\b/g, '$1')
    // Headings
    .replace(/^#{1,6}\s+/gm, '')
    // Blockquote marker
    .replace(/^>\s?/gm, '')
    // List markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Collapse whitespace
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
