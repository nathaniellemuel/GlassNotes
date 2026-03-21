type Selection = { start: number; end: number };
type FormatResult = { newText: string; newSelection: Selection };

// Style markers for bold and italic (invisible Unicode characters)
export const STYLE_MARKERS = {
  bold: { start: '​', end: '‌' },
  italic: { start: '‍', end: '﻿' },
} as const;

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
  const { start, end } = selection;
  
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
  
  let lineEnd = end;
  while (lineEnd < text.length && text[lineEnd] !== '\n') lineEnd++;
  
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

export type ListType = 'bullet' | 'number' | 'dash' | 'roman';

const LIST_PREFIXES: Record<ListType, string> = {
  bullet: '• ',
  number: '1. ',
  dash: '— ',
  roman: 'i. ',
};

/**
 * Toggle list type on current line
 * If line already has a list prefix, replace it with new type
 * Otherwise, add the new type prefix
 */
export function toggleListType(text: string, selection: Selection, type: ListType): FormatResult {
  const prefix = LIST_PREFIXES[type];
  const { start, end } = selection;

  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;

  let lineEnd = end;
  while (lineEnd < text.length && text[lineEnd] !== '\n') lineEnd++;

  const line = text.slice(lineStart, lineEnd);

  // Check if line already has any list prefix
  const existingPrefixes = Object.values(LIST_PREFIXES);
  let hasExistingPrefix = false;
  let existingPrefixLength = 0;

  for (const existingPrefix of existingPrefixes) {
    if (line.startsWith(existingPrefix)) {
      hasExistingPrefix = true;
      existingPrefixLength = existingPrefix.length;
      break;
    }
  }

  if (hasExistingPrefix) {
    // Replace existing prefix with new one
    const lineContent = line.slice(existingPrefixLength);
    const newText = text.slice(0, lineStart) + prefix + lineContent + text.slice(lineEnd);
    return {
      newText,
      newSelection: {
        start: lineStart + prefix.length,
        end: lineStart + prefix.length + (end - start),
      },
    };
  } else {
    // Add new prefix
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

export function stripFormatting(text: string): string {
  return text
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/[\u2060-\u206F]/g, '')
    .replace(/^# /gm, '')
    .replace(/^- /gm, '')
    .replace(/^• /gm, '')
    .replace(/^1\. /gm, '')
    .replace(/^— /gm, '')
    .replace(/^i\. /gm, '')
    .replace(/^---$/gm, '')
    .trim();
}

export const COLOR_MARKERS = {
  red: { start: '\u2060', end: '\u2061' },
  orange: { start: '\u2062', end: '\u2063' },
  yellow: { start: '\u2064', end: '\u2065' },
  green: { start: '\u2066', end: '\u2067' },
  blue: { start: '\u2068', end: '\u2069' },
  purple: { start: '\u206A', end: '\u206B' },
  pink: { start: '\u206C', end: '\u206D' },
  cyan: { start: '\u206E', end: '\u206F' },
  gray: { start: '\uFEFF', end: '\u200B' },
} as const;

export type TextColorId = keyof typeof COLOR_MARKERS | 'default';

export function applyTextColor(text: string, selection: Selection, colorId: TextColorId): FormatResult {
  const { start, end } = selection;

  // If no selection, do nothing for color (require explicit selection)
  if (start === end) {
    return { newText: text, newSelection: selection };
  }

  // Get selected text and remove existing color markers
  let selectedText = text.slice(start, end);
  const cleanSelected = removeColorMarkers(selectedText);

  // If "default" color, just remove color markers (revert to white)
  if (colorId === 'default') {
    const newText = text.slice(0, start) + cleanSelected + text.slice(end);
    return {
      newText,
      newSelection: { start, end: start + cleanSelected.length },
    };
  }

  // Apply new color to the clean (unmarked) selected text
  const marker = COLOR_MARKERS[colorId as keyof typeof COLOR_MARKERS];
  const colored = `${marker.start}${cleanSelected}${marker.end}`;
  const newText = text.slice(0, start) + colored + text.slice(end);

  return {
    newText,
    newSelection: { start, end: start + colored.length },
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
