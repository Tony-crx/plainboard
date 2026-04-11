/**
 * Output formatting utilities
 */

/**
 * Pretty print JSON
 */
export function prettyJson(obj: any, indent: number = 2): string {
  return JSON.stringify(obj, null, indent);
}

/**
 * Format a table as aligned text
 */
export function formatTable(
  headers: string[],
  rows: string[][],
  padding: number = 2
): string {
  const allRows = [headers, ...rows];
  const colWidths = headers.map((_, i) =>
    Math.max(...allRows.map(row => (row[i] || '').length), headers[i].length) + padding
  );

  const padCell = (str: string, width: number) => str.padEnd(width);

  const headerLine = headers.map((h, i) => padCell(h, colWidths[i])).join('|');
  const separator = colWidths.map(w => '-'.repeat(w)).join('+');
  const dataLines = rows.map(row =>
    row.map((cell, i) => padCell(cell, colWidths[i])).join('|')
  );

  return [headerLine, separator, ...dataLines].join('\n');
}

/**
 * Format a list as bullet points
 */
export function formatBulletList(items: string[], bullet: string = '•'): string {
  return items.map(item => `${bullet} ${item}`).join('\n');
}

/**
 * Format a list as numbered
 */
export function formatNumberedList(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

/**
 * Create a key-value display block
 */
export function formatKeyValue(obj: Record<string, any>, labelWidth: number = 20): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      const label = key.padEnd(labelWidth);
      const displayValue = typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
      return `${label}: ${displayValue}`;
    })
    .join('\n');
}

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(num: number, locales: string = 'en-US'): string {
  return num.toLocaleString(locales);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, total: number, decimals: number = 2): string {
  const percent = total === 0 ? 0 : (value / total) * 100;
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locales: string = 'en-US'
): string {
  return new Intl.NumberFormat(locales, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate text to word count
 */
export function truncateWords(text: string, wordCount: number, suffix: string = '...'): string {
  const words = text.split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + suffix;
}

/**
 * Format a duration in milliseconds to human-readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Create a text-based progress bar
 */
export function progressBar(current: number, total: number, width: number = 30): string {
  const percent = current / total;
  const filled = Math.round(percent * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${(percent * 100).toFixed(0)}% (${current}/${total})`;
}

/**
 * Wrap text to a maximum width
 */
export function wrapText(text: string, maxWidth: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

/**
 * Indent text
 */
export function indent(text: string, spaces: number = 2): string {
  const prefix = ' '.repeat(spaces);
  return text.split('\n').map(line => prefix + line).join('\n');
}

/**
 * Center text within a width
 */
export function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  return ' '.repeat(leftPad) + text;
}
