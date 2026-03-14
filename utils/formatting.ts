type Selection = { start: number; end: number };
type FormatResult = { newText: string; newSelection: Selection };

export function toggleBold(text: string, selection: Selection): FormatResult {
  return toggleWrap(text, selection, '**');
}

export function toggleItalic(text: string, selection: Selection): FormatResult {
  return toggleWrap(text, selection, '*');
}

function toggleWrap(text: string, selection: Selection, marker: string): FormatResult {
  const { start, end } = selection;
  const len = marker.length;

  if (start === end) {
    const newText = text.slice(0, start) + marker + marker + text.slice(start);
    return { newText, newSelection: { start: start + len, end: start + len } };
  }

  const selected = text.slice(start, end);
  const before = text.slice(Math.max(0, start - len), start);
  const after = text.slice(end, end + len);

  if (before === marker && after === marker) {
    const newText = text.slice(0, start - len) + selected + text.slice(end + len);
    return { newText, newSelection: { start: start - len, end: end - len } };
  }

  const newText = text.slice(0, start) + marker + selected + marker + text.slice(end);
  return { newText, newSelection: { start: start + len, end: end + len } };
}

export function toggleHeading(text: string, selection: Selection): FormatResult {
  return toggleLinePrefix(text, selection, '# ');
}

export function toggleBullet(text: string, selection: Selection): FormatResult {
  return toggleLinePrefix(text, selection, '- ');
}

function toggleLinePrefix(text: string, selection: Selection, prefix: string): FormatResult {
  const { start } = selection;

  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;

  const lineEnd = text.indexOf('\n', start);
  const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
  const line = text.slice(lineStart, actualLineEnd);

  if (line.startsWith(prefix)) {
    const newText = text.slice(0, lineStart) + line.slice(prefix.length) + text.slice(actualLineEnd);
    const offset = -prefix.length;
    return {
      newText,
      newSelection: {
        start: Math.max(lineStart, start + offset),
        end: Math.max(lineStart, start + offset),
      },
    };
  }

  const newText = text.slice(0, lineStart) + prefix + line + text.slice(actualLineEnd);
  return {
    newText,
    newSelection: { start: start + prefix.length, end: start + prefix.length },
  };
}

export function stripFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^# /gm, '')
    .replace(/^- /gm, '')
    .replace(/^---$/gm, '')
    .replace(/\n/g, ' ')
    .trim();
}
