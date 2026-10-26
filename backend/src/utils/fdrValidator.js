const VALID_STATUSES = [
  'SUBMITTED',
  'UNDER_VERIFICATION',
  'APPROVED',
  'DISCREPANCY',
  'ACTIVE',
  'EXPIRED',
  'RELEASE_REQUESTED',
  'RELEASED',
];

/**
 * Validates request payload for creating or updating an FDR record.
 * @param {object} data
 * @param {boolean} isUpdate - true if partial updates are allowed
 */
export function validateFdrInput(data, isUpdate = false) {
  const errors = [];

  // FDR Number
  if (!isUpdate || data.fdrNumber !== undefined) {
    if (!data.fdrNumber || typeof data.fdrNumber !== 'string' || !data.fdrNumber.trim()) {
      errors.push('FDR number is required and cannot be empty.');
    }
  }

  // Institution (institutionId or institution object/name)
  if (!isUpdate || data.institutionId !== undefined || data.institution !== undefined) {
    const hasInstId = data.institutionId !== undefined && data.institutionId !== null && data.institutionId !== '';
    const hasInstName = data.institution && typeof data.institution === 'string' && data.institution.trim();
    if (!hasInstId && !hasInstName) {
      errors.push('Institution (institutionId or institution name) is required.');
    }
  }

  // Bank Name
  const bankValue = data.bankName || data.bank;
  if (!isUpdate || data.bankName !== undefined || data.bank !== undefined) {
    if (!bankValue || typeof bankValue !== 'string' || !bankValue.trim()) {
      errors.push('Bank name is required and cannot be empty.');
    }
  }

  // Amount
  if (!isUpdate || data.amount !== undefined) {
    if (data.amount === undefined || data.amount === null || data.amount === '') {
      errors.push('Amount is required.');
    } else {
      // Clean up currency symbols or commas if passed as string (e.g. "₹35,00,000" or "3500000")
      const numStr = String(data.amount).replace(/[₹, ]/g, '');
      const parsedAmount = parseFloat(numStr);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push('Amount must be a valid positive number.');
      }
    }
  }

  // Dates
  let parsedIssue = null;
  let parsedMaturity = null;

  if (!isUpdate || data.issueDate !== undefined) {
    if (!data.issueDate) {
      errors.push('Issue date is required.');
    } else {
      parsedIssue = new Date(data.issueDate);
      if (isNaN(parsedIssue.getTime())) {
        errors.push('Issue date must be a valid date.');
      }
    }
  }

  if (!isUpdate || data.maturityDate !== undefined) {
    if (!data.maturityDate) {
      errors.push('Maturity date is required.');
    } else {
      parsedMaturity = new Date(data.maturityDate);
      if (isNaN(parsedMaturity.getTime())) {
        errors.push('Maturity date must be a valid date.');
      }
    }
  }

  // Date comparison
  if (parsedIssue && parsedMaturity) {
    if (parsedMaturity < parsedIssue) {
      errors.push('Maturity date cannot be before issue date.');
    }
  }

  // Status (optional, but if provided must be valid)
  if (data.status !== undefined) {
    const normalizedStatus = String(data.status).toUpperCase().replace(/ /g, '_');
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
