/**
 * Russian pluralization utility
 * Handles correct plural forms for Russian language
 */

/**
 * Get correct plural form for Russian
 * @param count - Number
 * @param forms - Array of 3 forms: [1, 2-4, 5+]
 * @returns Correct form
 */
export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return forms[2]; // 11-19: всегда форма 5+
  }

  if (mod10 === 1) {
    return forms[0]; // 1, 21, 31, ...: форма 1
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return forms[1]; // 2-4, 22-24, ...: форма 2-4
  }

  return forms[2]; // 5-9, 10, 20, ...: форма 5+
}

/**
 * Pluralize "поездка"
 */
export function pluralizeRide(count: number): string {
  return pluralize(count, ['поездка', 'поездки', 'поездок']);
}

/**
 * Pluralize "место"
 */
export function pluralizeSeat(count: number): string {
  return pluralize(count, ['место', 'места', 'мест']);
}

/**
 * Pluralize "пассажир"
 */
export function pluralizePassenger(count: number): string {
  return pluralize(count, ['пассажир', 'пассажира', 'пассажиров']);
}

/**
 * Format count with plural form
 * Example: "5 поездок", "1 поездка", "2 поездки"
 */
export function formatCount(count: number, forms: [string, string, string]): string {
  return `${count} ${pluralize(count, forms)}`;
}

