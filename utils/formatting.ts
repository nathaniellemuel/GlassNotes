type Selection = { start: number; end: number };
type FormatResult = { newText: string; newSelection: Selection };

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

export function toggleBold(text: string, selection: Selection): FormatResult {
  return toggleStyled(text, selection, boldForward, boldReverse, /[A-Za-z0-9]/);
}

export function toggleItalic(text: string, selection: Selection): FormatResult {
  return toggleStyled(text, selection, italicForward, italicReverse, /[A-Za-z]/);
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
  const { start } = selection;
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;

  const lineEnd = text.indexOf('\n', start);
  const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
  const line = text.slice(lineStart, actualLineEnd);
  const hasLetters = /[A-Za-z]/.test(line);
  if (!hasLetters) return { newText: text, newSelection: selection };

  const newLine = line === line.toUpperCase() ? line.toLowerCase() : line.toUpperCase();
  const newText = text.slice(0, lineStart) + newLine + text.slice(actualLineEnd);
  return {
    newText,
    newSelection: selection,
  };
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
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^# /gm, '')
    .replace(/^- /gm, '')
    .replace(/^---$/gm, '')
    .replace(/\n/g, ' ')
    .trim();
}
