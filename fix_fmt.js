const fs = require('fs');

const replacement = `type Selection = { start: number; end: number };
type FormatResult = { newText: string; newSelection: Selection };

export const STYLE_MARKERS = {
  bold: { start: '\u200B', end: '\u200C' },
  italic: { start: '\u200D', end: '\uFEFF' },
} as const;

function getWordRange(text: string, cursor: number, wordChar: RegExp): Selection {
  if (!text) return { start: cursor, end: cursor };
  let s = Math.min(cursor, text.length);
  let e = Math.min(cursor, text.length);
  while (s > 0 && wordChar.test(text[s - 1])) s--;
  while (e < text.length && wordChar.test(text[e])) e++;
  return { start: s, end: e };
}

function toggleMarker(text: string, selection: Selection, marker: {start: string, end: string}, wordChar: RegExp): FormatResult {
  const { start, end } = selection;
  let targetStart = start;
  let targetEnd = end;

  if (start === end) {
    const wordRange = getWordRange(text, start, wordChar);
    targetStart = wordRange.start;
    targetEnd = wordRange.end;
  }

  if (targetStart === targetEnd) {
    return { newText: text, newSelection: selection };
  }

  let selected = text.slice(targetStart, targetEnd);
  const before = text.slice(0, targetStart);
  const after = text.slice(targetEnd);

  if (before.endsWith(marker.start) && after.startsWith(marker.end)) {
    const newText = before.slice(0, -marker.start.length) + selected + after.slice(marker.end.length);
    return {
      newText,
      newSelection: { start: targetStart - marker.start.length, end: targetEnd - marker.start.length },
    };
  }

  if (selected.startsWith(marker.start) && selected.endsWith(marker.end)) {
    const unselected = selected.slice(marker.start.length, -marker.end.length);
    const newText = before + unselected + after;
    return {
      newText,
      newSelection: { start: targetStart, end: targetStart + unselected.length },
    };
  }

  selected = selected.replace(new RegExp(marker.start, 'g'), '').replace(new RegExp(marker.end, 'g'), '');
  const newText = before + marker.start + selected + marker.end + after;
  return {
    newText,
    newSelection: { start: targetStart, end: targetStart + marker.start.length + selected.length + marker.end.length },
  };
}

export function toggleBold(text: string, selection: Selection): FormatResult {
  return toggleMarker(text, selection, STYLE_MARKERS.bold, /[^\\s]/);
}

export function toggleItalic(text: string, selection: Selection): FormatResult {
  return toggleMarker(text, selection, STYLE_MARKERS.italic, /[^\\s]/);
}

function toggleLinePrefix(text: string, selection: Selection, prefix: string): FormatResult {
  const { start, end } = selection;
  
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\\n') lineStart--;
  
  let lineEnd = end;
  while (lineEnd < text.length && text[lineEnd] !== '\\n') lineEnd++;
  
  const line = text.slice(lineStart, lineEnd);
  
  if (line.startsWith(prefix)) {
    const newText = text.slice(0, lineStart) + line.slice(prefix.length) + text.slice(lineEnd);
    return {
      newText,
      newSelection: {
        start: Math.max(lineStart, start - prefix.length),
        end: Math.max(lineStart, end - prefix.length),
      },
    };
  } else {
    const newText = text.slice(0, lineStart) + prefix + line + text.slice(lineEnd);
    return {
      newText,
      newSelection: {
        start: start + prefix.length,
        end: end + prefix.length,
      },
    };
  }
}

export function toggleHeading(text: string, selection: Selection): FormatResult {
  return toggleLinePrefix(text, selection, '# ');
}

export function toggleUppercase(text: string, selection: Selection): FormatResult {
  const { start, end } = selection;
  let targetStart = start;
  let targetEnd = end;

  if (start === end) {
    const wordRange = getWordRange(text, start, /[a-zA-Z]/);
    targetStart = wordRange.start;
    targetEnd = wordRange.end;
  }

  if (targetStart === targetEnd) {
    return { newText: text, newSelection: selection };
  }

  const selected = text.slice(targetStart, targetEnd);
  const isAllUpper = selected === selected.toUpperCase() && selected !== selected.toLowerCase();
  const transformed = isAllUpper ? selected.toLowerCase() : selected.toUpperCase();

  const newText = text.slice(0, targetStart) + transformed + text.slice(targetEnd);
  return {
    newText,
    newSelection: { start: targetStart, end: targetStart + transformed.length },
  };
}

export function toggleBullet(text: string, selection: Selection): FormatResult {
  return toggleLinePrefix(text, selection, '- ');
}

export function stripFormatting(text: string): string {
  return text
    .replace(/[\\u200B\\u200C\\u200D\\uFEFF]/g, '')
    .replace(/[\\u2060-\\u206F]/g, '')
    .replace(/^# /gm, '')
    .replace(/^- /gm, '')
    .replace(/^---$/gm, '')
    .trim();
}

export const COLOR_MARKERS = {
  red: { start: '\\u2060', end: '\\u206F' },
  orange: { start: '\\u2061', end: '\\u206F' },
  yellow: { start: '\\u2062', end: '\\u206F' },
  green: { start: '\\u2063', end: '\\u206F' },
  blue: { start: '\\u2064', end: '\\u206F' },
  purple: { start: '\\u206A', end: '\\u206F' },
  pink: { start: '\\u206B', end: '\\u206F' },
  cyan: { start: '\\u206C', end: '\\u206F' },
  gray: { start: '\\u206D', end: '\\u206F' },
} as const;

export type TextColorId = keyof typeof COLOR_MARKERS | 'default';

export function applyTextColor(text: string, selection: Selection, colorId: TextColorId): FormatResult {
  const { start, end } = selection;
  let targetStart = start;
  let targetEnd = end;

  if (start === end) {
    const wordRange = getWordRange(text, start, /[^\\s]/);
    targetStart = wordRange.start;
    targetEnd = wordRange.end;
  }

  if (targetStart === targetEnd) {
    return { newText: text, newSelection: selection };
  }

  let selected = text.slice(targetStart, targetEnd);

  selected = removeColorMarkers(selected);

  if (colorId === 'default') {
    const newText = text.slice(0, targetStart) + selected + text.slice(targetEnd);
    return {
      newText,
      newSelection: { start: targetStart, end: targetStart + selected.length },
    };
  }

  const marker = COLOR_MARKERS[colorId as keyof typeof COLOR_MARKERS];
  const colored = \`\${marker.start}\${selected}\${marker.end}\`;
  const newText = text.slice(0, targetStart) + colored + text.slice(targetEnd);

  return {
    newText,
    newSelection: { start: targetStart, end: targetStart + colored.length },
  };
}

function removeColorMarkers(text: string): string {
  let result = text;
  Object.values(COLOR_MARKERS).forEach(marker => {
    result = result.replace(new RegExp(marker.start, 'g'), '');
    result = result.replace(new RegExp(marker.end, 'g'), '');
  });
  return result;
}
`;

fs.writeFileSync('C:/Users/Dragon/Native-Projects/GlassNotes/utils/formatting.ts', replacement);
console.log("Formatting API updated successfully!");
