// Converts a currency amount into the words line printed on a check,
// e.g. 12345.67 -> "Twelve Thousand Three Hundred Forty-Five and 67/100"

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];
// Indian/Sri Lankan numbering (Lakh/Crore) since amounts are in LKR.
const SCALES: [number, string][] = [
  [10000000, 'Crore'],
  [100000, 'Lakh'],
  [1000, 'Thousand'],
  [100, 'Hundred'],
];

function chunkToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + chunkToWords(n % 100) : '');
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  let remaining = n;
  const parts: string[] = [];
  for (const [value, label] of SCALES) {
    if (remaining >= value) {
      const count = Math.floor(remaining / value);
      parts.push(chunkToWords(count) + ' ' + label);
      remaining %= value;
    }
  }
  if (remaining > 0) parts.push(chunkToWords(remaining));
  return parts.join(' ').trim();
}

export function amountToWords(amount: number, currencyWord = ''): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);
  const wholeWords = integerToWords(whole);
  const centsStr = String(cents).padStart(2, '0');
  const prefix = currencyWord ? currencyWord + ' ' : '';
  return `${prefix}${wholeWords} and ${centsStr}/100`;
}
