export interface ParsedProduct {
  cleanName: string;
  expiryDate: Date | null;
}

/**
 * Parses expiry date from product name.
 * Primary format: "Jaws Blanche алк.4,5% об. 500мл / 2026-11-18 ЧЗ"
 * Separator: " / " (space-slash-space)
 * Date: YYYY-MM-DD (ISO)
 * Suffix ЧЗ (Честный Знак) is discarded.
 * Fallback formats: DD.MM.YYYY, DD/MM/YYYY with optional prefixes "СГ", "до".
 */
export function parseProductExpiry(name: string): ParsedProduct {
  const trimmed = name.trim();
  if (!trimmed) {
    return { cleanName: trimmed, expiryDate: null };
  }

  // Primary format: "{name} / {YYYY-MM-DD} ЧЗ" or "{name} / {YYYY-MM-DD}"
  const slashIdx = trimmed.lastIndexOf(' / ');
  if (slashIdx !== -1) {
    const before = trimmed.substring(0, slashIdx).trim();
    const after = trimmed.substring(slashIdx + 3).trim();

    // Try ISO date (YYYY-MM-DD), optionally followed by ЧЗ or other suffixes
    const isoMatch = after.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      const date = parseDate(isoMatch[1], 'iso');
      if (date) {
        return { cleanName: before, expiryDate: date };
      }
    }

    // Fallback: DD.MM.YYYY or DD/MM/YYYY after separator
    const dotMatch = after.match(/^(?:СГ\s*|до\s*)?(\d{2}[./]\d{2}[./]\d{4})/);
    if (dotMatch) {
      const date = parseDate(dotMatch[1], 'dmy');
      if (date) {
        return { cleanName: before, expiryDate: date };
      }
    }
  }

  // Fallback: date at end of name without " / " separator
  const endMatch = trimmed.match(/^(.+?)\s+(?:СГ\s*|до\s*)?(\d{4}-\d{2}-\d{2})\s*(?:ЧЗ)?$/);
  if (endMatch) {
    const date = parseDate(endMatch[2], 'iso');
    if (date) {
      return { cleanName: endMatch[1].trim(), expiryDate: date };
    }
  }

  const endDmyMatch = trimmed.match(
    /^(.+?)\s+(?:СГ\s*|до\s*)?(\d{2}[./]\d{2}[./]\d{4})\s*(?:ЧЗ)?$/,
  );
  if (endDmyMatch) {
    const date = parseDate(endDmyMatch[2], 'dmy');
    if (date) {
      return { cleanName: endDmyMatch[1].trim(), expiryDate: date };
    }
  }

  return { cleanName: trimmed, expiryDate: null };
}

function parseDate(dateStr: string, format: 'iso' | 'dmy'): Date | null {
  let year: number, month: number, day: number;

  if (format === 'iso') {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    const parts = dateStr.split(/[./]/);
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Validate the date is real (e.g., no Feb 30)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}
