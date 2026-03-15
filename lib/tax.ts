export const TAX_RATE = 0.12;
export const TAX_LABEL = "VAT (12%)";

export function calculateTax(subtotal: number): {
  taxAmount: number;
  taxRate: number;
  taxLabel: string;
} {
  if (subtotal <= 0) {
    return { taxAmount: 0, taxRate: TAX_RATE, taxLabel: TAX_LABEL };
  }

  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;

  return {
    taxAmount,
    taxRate: TAX_RATE,
    taxLabel: TAX_LABEL,
  };
}
