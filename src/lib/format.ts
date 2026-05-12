/**
 * Formatting Utilities
 * 
 * India-specific number, currency, and date formatting.
 * All amounts in the DB are stored in paise — these functions
 * convert to human-readable rupee strings with lakh/crore grouping.
 */

/**
 * Convert paise to rupees and format with Indian number grouping.
 * Example: 1234567 paise → "₹12,345.67"
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format a number with Indian grouping (lakhs, crores).
 * Example: 1234567 → "12,34,567"
 */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format an ISO date string to Indian DD/MM/YYYY format.
 */
export function formatDate(isoDate: string | Date): string {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date and time.
 */
export function formatDateTime(isoDate: string | Date): string {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert rupees to paise for storage.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees for display.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Validate an Indian GSTIN.
 * Format: 2 digits state code + 10 chars PAN + 1 entity code + 1 Z + 1 check digit
 */
export function isValidGSTIN(gstin: string): boolean {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return pattern.test(gstin);
}

/**
 * Validate an Indian PAN number.
 * Format: AAAAA9999A
 */
export function isValidPAN(pan: string): boolean {
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return pattern.test(pan);
}

/**
 * Get state name from GSTIN state code (first 2 digits).
 */
export function getStateFromGSTIN(gstin: string): string {
  const stateCodes: Record<string, string> = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
    '28': 'Andhra Pradesh (old)', '29': 'Karnataka', '30': 'Goa',
    '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
    '34': 'Puducherry', '35': 'Andaman & Nicobar',
    '36': 'Telangana', '37': 'Andhra Pradesh',
  };
  const code = gstin.substring(0, 2);
  return stateCodes[code] || 'Unknown';
}
