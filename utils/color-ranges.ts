/**
 * Text color formatting using ranges (like professional notes apps)
 * Content stays as plain text, formatting stored separately
 *
 * Example:
 * - content: "Hello world"
 * - colorRanges: [{color: 'red', start: 0, end: 5}]
 * - Result: "Hello" in red, " world" in white
 */

export type ColorRange = {
  color: string;
  start: number;
  end: number;
};

export type ColoredContent = {
  text: string;
  ranges: ColorRange[];
};

/**
 * Apply color to selected text range
 * If range overlaps existing color, it replaces it
 */
export function applyColorToRange(
  coloredContent: ColoredContent,
  start: number,
  end: number,
  color: string
): ColoredContent {
  if (start === end || start > end) {
    return coloredContent;
  }

  // Remove or merge overlapping ranges
  const newRanges = coloredContent.ranges
    .filter(range => {
      // If range overlaps with selection, remove it
      return range.end <= start || range.start >= end;
    })
    .map(range => {
      // Adjust positions if needed (for future text changes)
      return range;
    });

  // Add new color range
  newRanges.push({
    color,
    start,
    end,
  });

  // Sort by start position
  newRanges.sort((a, b) => a.start - b.start);

  return {
    text: coloredContent.text,
    ranges: newRanges,
  };
}

/**
 * Remove color from selected range (revert to white)
 */
export function removeColorFromRange(
  coloredContent: ColoredContent,
  start: number,
  end: number
): ColoredContent {
  const newRanges = coloredContent.ranges
    .map(range => {
      // If range is completely outside selection, keep it
      if (range.end <= start || range.start >= end) {
        return range;
      }

      // If range is completely inside selection, remove it (by returning null)
      if (range.start >= start && range.end <= end) {
        return null;
      }

      // If range partially overlaps, split it
      const results = [];
      if (range.start < start) {
        results.push({
          color: range.color,
          start: range.start,
          end: start,
        });
      }
      if (range.end > end) {
        results.push({
          color: range.color,
          start: end,
          end: range.end,
        });
      }
      return results;
    })
    .flat()
    .filter((r): r is ColorRange => r !== null);

  return {
    text: coloredContent.text,
    ranges: newRanges,
  };
}

/**
 * Get color at specific position
 */
export function getColorAtPosition(coloredContent: ColoredContent, position: number): string | undefined {
  const range = coloredContent.ranges.find(r => r.start <= position && position < r.end);
  return range?.color;
}

/**
 * Update text content and adjust ranges when user types/deletes
 */
export function updateContentAndRanges(
  coloredContent: ColoredContent,
  newText: string,
  selectionStart: number,
  selectionEnd: number,
  oldTextLength: number
): ColoredContent {
  const lengthDifference = newText.length - oldTextLength;

  // Adjust ranges based on text changes
  const newRanges = coloredContent.ranges
    .map(range => {
      // If range is before the change, don't adjust
      if (range.end <= selectionStart) {
        return range;
      }

      // If range is after the change, adjust start and end
      if (range.start >= selectionEnd) {
        return {
          color: range.color,
          start: range.start + lengthDifference,
          end: range.end + lengthDifference,
        };
      }

      // If range overlaps the change, adjust it
      return {
        color: range.color,
        start: range.start,
        end: Math.max(range.start, range.end + lengthDifference),
      };
    })
    .filter(range => range.start < range.end && range.end <= newText.length);

  return {
    text: newText,
    ranges: newRanges,
  };
}

/**
 * Serialize to plain text (for storage/export)
 */
export function serializeToPlainText(coloredContent: ColoredContent): string {
  return coloredContent.text;
}

/**
 * Create empty ColoredContent
 */
export function createEmptyColoredContent(): ColoredContent {
  return {
    text: '',
    ranges: [],
  };
}
