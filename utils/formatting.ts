type Selection = { start: number; end: number };
type FormatResult = { newText: string; newSelection: Selection };

// Bold + Italic Unicode pairs (combined styling)
const BOLD_ITALIC_PAIRS: Array<[string, string]> = [
  ['A', '𝑨'], ['B', '𝑩'], ['C', '𝑪'], ['D', '𝑫'], ['E', '𝑬'], ['F', '𝑭'], ['G', '𝑮'], ['H', '𝑯'], ['I', '𝑰'], ['J', '𝑱'], ['K', '𝑲'], ['L', '𝑳'], ['M', '𝑴'],
  ['N', '𝑵'], ['O', '𝑶'], ['P', '𝑷'], ['Q', '𝑸'], ['R', '𝑹'], ['S', '𝑺'], ['T', '𝑻'], ['U', '𝑼'], ['V', '𝑽'], ['W', '𝑾'], ['X', '𝑿'], ['Y', '𝒀'], ['Z', '𝒁'],
  ['a', '𝒂'], ['b', '𝒃'], ['c', '𝒄'], ['d', '𝒅'], ['e', '𝒆'], ['f', '𝒇'], ['g', '𝒈'], ['h', '𝒉'], ['i', '𝒊'], ['j', '𝒋'], ['k', '𝒌'], ['l', '𝒍'], ['m', '𝒎'],
  ['n', '𝒏'], ['o', '𝒐'], ['p', '𝒑'], ['q', '𝒒'], ['r', '𝒓'], ['s', '𝒔'], ['t', '𝒕'], ['u', '𝒖'], ['v', '𝒗'], ['w', '𝒘'], ['x', '𝒙'], ['y', '𝒚'], ['z', '𝒛'],
];

const BOLD_PAIRS: Array<[string, string]> = [
  ['A', '𝐀'], ['B', '𝐁'], ['C', '𝐂'], ['D', '𝐃'], ['E', '𝐄'], ['F', '𝐅'], ['G', '𝐆'], ['H', '𝐇'], ['I', '𝐈'], ['J', '𝐉'], ['K', '𝐊'], ['L', '𝐋'], ['M', '𝐌'],
  ['N', '𝐍'], ['O', '𝐎'], ['P', '𝐏'], ['Q', '𝐐'], ['R', '𝐑'], ['S', '𝐒'], ['T', '𝐓'], ['U', '𝐔'], ['V', '𝐕'], ['W', '𝐖'], ['X', '𝐗'], ['Y', '𝐘'], ['Z', '𝐙'],
  ['a', '𝐚'], ['b', '𝐛'], ['c', '𝐜'], ['d', '𝐝'], ['e', '𝐞'], ['f', '𝐟'], ['g', '𝐠'], ['h', '𝐡'], ['i', '𝐢'], ['j', '𝐣'], ['k', '𝐤'], ['l', '𝐥'], ['m', '𝐦'],
  ['n', '𝐧'], ['o', '𝐨'], ['p', '𝐩'], ['q', '𝐪'], ['r', '𝐫'], ['s', '𝐬'], ['t', '𝐭'], ['u', '𝐮'], ['v', '𝐯'], ['w', '𝐰'], ['x', '𝐱'], ['y', '𝐲'], ['z', '𝐳'],
  ['0', '𝟎'], ['1', '𝟏'], ['2', '𝟐'], ['3', '𝟑'], ['4', '𝟒'], ['5', '𝟓'], ['6', '𝟔'], ['7', '𝟕'], ['8', '𝟖'], ['9', '𝟗'],
];

const ITALIC_PAIRS: Array<[string, string]> = [
  ['A', '𝐴'], ['B', '𝐵'], ['C', '𝐶'], ['D', '𝐷'], ['E', '𝐸'], ['F', '𝐹'], ['G', '𝐺'], ['H', '𝐻'], ['I', '𝐼'], ['J', '𝐽'], ['K', '𝐾'], ['L', '𝐿'], ['M', '𝑀'],
  ['N', '𝑁'], ['O', '𝑂'], ['P', '𝑃'], ['Q', '𝑄'], ['R', '𝑅'], ['S', '𝑆'], ['T', '𝑇'], ['U', '𝑈'], ['V', '𝑉'], ['W', '𝑊'], ['X', '𝑋'], ['Y', '𝑌'], ['Z', '𝑍'],
  ['a', '𝑎'], ['b', '𝑏'], ['c', '𝑐'], ['d', '𝑑'], ['e', '𝑒'], ['f', '𝑓'], ['g', '𝑔'], ['h', 'ℎ'], ['i', '𝑖'], ['j', '𝑗'], ['k', '𝑘'], ['l', '𝑙'], ['m', '𝑚'],
  ['n', '𝑛'], ['o', '𝑜'], ['p', '𝑝'], ['q', '𝑞'], ['r', '𝑟'], ['s', '𝑠'], ['t', '𝑡'], ['u', '𝑢'], ['v', '𝑣'], ['w', '𝑤'], ['x', '𝑥'], ['y', '𝑦'], ['z', '𝑧'],
];

const boldForward = new Map(BOLD_PAIRS);
const boldReverse = new Map(BOLD_PAIRS.map(([normal, styled]) => [styled, normal]));
const italicForward = new Map(ITALIC_PAIRS);
const italicReverse = new Map(ITALIC_PAIRS.map(([normal, styled]) => [styled, normal]));
const boldItalicForward = new Map(BOLD_ITALIC_PAIRS);
const boldItalicReverse = new Map(BOLD_ITALIC_PAIRS.map(([normal, styled]) => [styled, normal]));

// Build reverse maps for bold -> italic and italic -> bold transitions
const boldToItalic = new Map<string, string>();
const italicToBold = new Map<string, string>();
const boldToBoldItalic = new Map<string, string>();
const italicToBoldItalic = new Map<string, string>();
const boldItalicToBold = new Map<string, string>();
const boldItalicToItalic = new Map<string, string>();

BOLD_PAIRS.forEach(([normal, bold]) => {
  const italic = italicForward.get(normal);
  const boldItalic = boldItalicForward.get(normal);
  if (italic) boldToItalic.set(bold, italic);
  if (boldItalic) boldToBoldItalic.set(bold, boldItalic);
});

ITALIC_PAIRS.forEach(([normal, italic]) => {
  const bold = boldForward.get(normal);
  const boldItalic = boldItalicForward.get(normal);
  if (bold) italicToBold.set(italic, bold);
  if (boldItalic) italicToBoldItalic.set(italic, boldItalic);
});

BOLD_ITALIC_PAIRS.forEach(([normal, boldItalic]) => {
  const bold = boldForward.get(normal);
  const italic = italicForward.get(normal);
  if (bold) boldItalicToBold.set(boldItalic, bold);
  if (italic) boldItalicToItalic.set(boldItalic, italic);
});

export function toggleBold(text: string, selection: Selection): FormatResult {
  return toggleStyledAdvanced(text, selection, 'bold', /[A-Za-z0-9]/);
}

export function toggleItalic(text: string, selection: Selection): FormatResult {
  return toggleStyledAdvanced(text, selection, 'italic', /[A-Za-z]/);
}

function toggleStyledAdvanced(
  text: string,
  selection: Selection,
  style: 'bold' | 'italic',
  wordChar: RegExp,
): FormatResult {
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

  const selected = text.slice(targetStart, targetEnd);
  const transformed = transformCharsAdvanced(selected, style);
  const newText = text.slice(0, targetStart) + transformed + text.slice(targetEnd);
  return {
    newText,
    newSelection: { start: targetStart, end: targetStart + transformed.length },
  };
}

function transformCharsAdvanced(text: string, toggleStyle: 'bold' | 'italic'): string {
  return text.split('').map(char => {
    // Check current styling state
    const isBold = boldReverse.has(char);
    const isItalic = italicReverse.has(char);
    const isBoldItalic = boldItalicReverse.has(char);

    if (toggleStyle === 'bold') {
      if (isBoldItalic) {
        // Bold+Italic → Italic (remove bold)
        return boldItalicToItalic.get(char) || char;
      } else if (isBold) {
        // Bold → Normal (remove bold)
        return boldReverse.get(char) || char;
      } else if (isItalic) {
        // Italic → Bold+Italic (add bold)
        return italicToBoldItalic.get(char) || char;
      } else {
        // Normal → Bold (add bold)
        return boldForward.get(char) || char;
      }
    } else { // toggleStyle === 'italic'
      if (isBoldItalic) {
        // Bold+Italic → Bold (remove italic)
        return boldItalicToBold.get(char) || char;
      } else if (isItalic) {
        // Italic → Normal (remove italic)
        return italicReverse.get(char) || char;
      } else if (isBold) {
        // Bold → Bold+Italic (add italic)
        return boldToBoldItalic.get(char) || char;
      } else {
        // Normal → Italic (add italic)
        return italicForward.get(char) || char;
      }
    }
  }).join('');
}

function toggleStyled(
  text: string,
  selection: Selection,
  forward: Map<string, string>,
  reverse: Map<string, string>,
  wordChar: RegExp,
): FormatResult {
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

  const selected = text.slice(targetStart, targetEnd);
  const shouldUnstyle = hasStyledChars(selected, reverse);
  const transformed = transformChars(selected, shouldUnstyle ? reverse : forward);
  const newText = text.slice(0, targetStart) + transformed + text.slice(targetEnd);
  return {
    newText,
    newSelection: { start: targetStart, end: targetStart + transformed.length },
  };
}

function getWordRange(text: string, cursor: number, wordChar: RegExp): Selection {
  if (!text) return { start: cursor, end: cursor };
  let s = Math.min(cursor, text.length);
  let e = Math.min(cursor, text.length);
  while (s > 0 && wordChar.test(text[s - 1])) s--;
  while (e < text.length && wordChar.test(text[e])) e++;
  return { start: s, end: e };
}

function hasStyledChars(text: string, reverseMap: Map<string, string>): boolean {
  for (const ch of text) {
    if (reverseMap.has(ch)) return true;
  }
  return false;
}

function transformChars(text: string, map: Map<string, string>): string {
  let out = '';
  for (const ch of text) {
    out += map.get(ch) ?? ch;
  }
  return out;
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
  const normalized = transformChars(transformChars(text, boldReverse), italicReverse);
  return normalized
    .replace(/[\u2060-\u206F]/g, '')
    .replace(/[🔴🟠🟡🟢🔵🟣🩷🩵⚪⚫]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^# /gm, '')
    .replace(/^- /gm, '')
    .replace(/^---$/gm, '')
    .replace(/\n/g, ' ')
    .trim();
}

// Text color using true invisible Unicode markers
export const COLOR_MARKERS = {
  red: { start: '\u2060', end: '\u206F' },
  orange: { start: '\u2061', end: '\u206F' },
  yellow: { start: '\u2062', end: '\u206F' },
  green: { start: '\u2063', end: '\u206F' },
  blue: { start: '\u2064', end: '\u206F' },
  purple: { start: '\u206A', end: '\u206F' },
  pink: { start: '\u206B', end: '\u206F' },
  cyan: { start: '\u206C', end: '\u206F' },
  gray: { start: '\u206D', end: '\u206F' },
} as const;

export type TextColorId = keyof typeof COLOR_MARKERS | 'default';

export function applyTextColor(text: string, selection: Selection, colorId: TextColorId): FormatResult {
  const { start, end } = selection;
  let targetStart = start;
  let targetEnd = end;

  // If no selection, expand to word
  if (start === end) {
    const wordRange = getWordRange(text, start, /[A-Za-z0-9]/);
    targetStart = wordRange.start;
    targetEnd = wordRange.end;
  }

  if (targetStart === targetEnd) {
    return { newText: text, newSelection: selection };
  }

  let selected = text.slice(targetStart, targetEnd);
  
  // Remove existing color markers
  selected = removeColorMarkers(selected);

  // If default color, just remove markers
  if (colorId === 'default') {
    const newText = text.slice(0, targetStart) + selected + text.slice(targetEnd);
    return {
      newText,
      newSelection: { start: targetStart, end: targetStart + selected.length },
    };
  }

  // Add new color markers
  const marker = COLOR_MARKERS[colorId as keyof typeof COLOR_MARKERS];
  const colored = `${marker.start}${selected}${marker.end}`;
  const newText = text.slice(0, targetStart) + colored + text.slice(targetEnd);
  
  return {
    newText,
    newSelection: { start: targetStart, end: targetStart + colored.length },
  };
}

function removeColorMarkers(text: string): string {
  let result = text;
  // Remove all current invisible color markers and old emoji markers
  Object.values(COLOR_MARKERS).forEach(marker => {
    result = result.replace(new RegExp(marker.start, 'g'), '');
    result = result.replace(new RegExp(marker.end, 'g'), '');
  });
  // Clean up legacy emojis just in case
  result = result.replace(/[🔴🟠🟡🟢🔵🟣🩷🩵⚪⚫]/g, '');
  return result;
}

// Get text segments with their colors for rendering
export type ColoredSegment = { text: string; color?: string };

export function parseColoredText(text: string): ColoredSegment[] {
  const segments: ColoredSegment[] = [];
  const colorMap = {
    '🔴': '#EF4444',
    '🟠': '#F97316',
    '🟡': '#EAB308',
    '🟢': '#22C55E',
    '🔵': '#3B82F6',
    '🟣': '#A855F7',
    '🩷': '#EC4899',
    '🩵': '#06B6D4',
    '⚪': '#9CA3AF',
  } as const;

  let currentPos = 0;
  let currentColor: string | undefined;
  let buffer = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Check if it's a color start marker
    const colorEntry = Object.entries(colorMap).find(([emoji]) => emoji === char);
    if (colorEntry) {
      if (buffer) {
        segments.push({ text: buffer, color: currentColor });
        buffer = '';
      }
      currentColor = colorEntry[1];
      continue;
    }

    // Check if it's end marker
    if (char === '⚫') {
      if (buffer) {
        segments.push({ text: buffer, color: currentColor });
        buffer = '';
      }
      currentColor = undefined;
      continue;
    }

    buffer += char;
  }

  if (buffer) {
    segments.push({ text: buffer, color: currentColor });
  }

  return segments;
}
