export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

export function formatINRLpa(annualInr: number): string {
  if (!Number.isFinite(annualInr) || annualInr <= 0) return '₹0 LPA';
  if (annualInr >= 10_000_000) {
    const cr = Math.round((annualInr / 10_000_000) * 100) / 100;
    return `₹${Number.isInteger(cr) ? cr.toFixed(0) : cr} Cr`;
  }
  const lpa = Math.round((annualInr / 100_000) * 10) / 10;
  return `₹${Number.isInteger(lpa) ? lpa.toFixed(0) : lpa} LPA`;
}

export function formatINRCompact(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '₹0';
  if (amount >= 10_000_000) {
    const cr = Math.round((amount / 10_000_000) * 100) / 100;
    return `₹${Number.isInteger(cr) ? cr.toFixed(0) : cr} Cr`;
  }
  if (amount >= 100_000) {
    const l = Math.round((amount / 100_000) * 10) / 10;
    return `₹${Number.isInteger(l) ? l.toFixed(0) : l} L`;
  }
  return formatINR(amount);
}

export function formatINRMonthly(monthlyInr: number): string {
  return `${formatINR(monthlyInr)}/month`;
}

export function formatCurrencyAmount(amount: number, currency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR'): string {
  if (!Number.isFinite(amount)) return '₹0';
  if (currency === 'INR') return formatINR(amount);
  const localeMap: Record<'USD' | 'EUR' | 'GBP', string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatSalaryRangeINR(minAnnualInr: number, maxAnnualInr: number): string {
  const minLpa = Math.round((minAnnualInr / 100_000) * 10) / 10;
  const maxLpa = Math.round((maxAnnualInr / 100_000) * 10) / 10;
  const fmt = (n: number) => (Number.isInteger(n) ? n.toFixed(0) : String(n));
  return `₹${fmt(minLpa)} – ₹${fmt(maxLpa)} LPA`;
}

/**
 * Converts legacy USD compensation strings like "$115k – $165k" into realistic
 * Indian market ₹ LPA bands for roles across all 9 domains.
 */
export function usdRangeToIndianLpaRange(usdRange: string): string {
  const nums = usdRange.match(/\d+/g)?.map((n) => Number(n)) ?? [];
  if (nums.length < 2) {
    return usdRange.includes('₹') ? usdRange : '₹8 – ₹18 LPA';
  }
  // Realistic India annual CTC mapping from US $k benchmark (~0.14x–0.18x in LPA terms)
  const minLpa = Math.max(4, Math.round(nums[0] * 0.12));
  const maxLpa = Math.max(minLpa + 4, Math.round(nums[1] * 0.16));
  return `₹${minLpa} – ₹${maxLpa} LPA`;
}

export function validateSalaryExpectations(
  expectedAnnualSalaryInr: number,
  minimumExpectedSalaryInr: number
): { valid: boolean; expected: number; minimum: number; error?: string } {
  const expected = Math.round(Number(expectedAnnualSalaryInr));
  const minimum = Math.round(Number(minimumExpectedSalaryInr));

  if (!Number.isFinite(expected) || expected < 0) {
    return { valid: false, expected: 0, minimum: 0, error: 'Expected annual salary must be a positive ₹ amount.' };
  }
  if (!Number.isFinite(minimum) || minimum < 0) {
    return { valid: false, expected: 0, minimum: 0, error: 'Minimum expected salary cannot be negative.' };
  }
  if (minimum > expected && expected > 0) {
    return {
      valid: false,
      expected,
      minimum,
      error: `Minimum expected salary (${formatINRLpa(minimum)}) cannot exceed expected salary (${formatINRLpa(expected)}).`,
    };
  }
  return { valid: true, expected, minimum };
}
