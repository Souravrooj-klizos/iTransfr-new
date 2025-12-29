export interface Owner {
  id?: string;
  type: 'person' | 'entity';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  ownershipPercentage: number;
  isAuthorizedSigner?: boolean;
  role?: string;
  title?: string;
  // Entity owner fields
  entityName?: string;
  countryOfIncorporation?: string;
  entityType?: string;
  registrationNumber?: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalPercentage: number;
  error?: string;
  warning?: string;
}

export class OwnershipValidationService {
  /**
   * Validates that ownership percentages total exactly 100%
   */
  static validateOwnership(owners: Owner[]): ValidationResult {
    if (!owners || owners.length === 0) {
      return {
        isValid: false,
        totalPercentage: 0,
        error: 'At least one owner is required',
      };
    }

    // Calculate total ownership percentage
    const totalPercentage = owners.reduce((sum, owner) => {
      const percentage = owner.ownershipPercentage || 0;
      return sum + percentage;
    }, 0);

    // Round to 2 decimal places to avoid floating point issues
    const roundedTotal = Math.round(totalPercentage * 100) / 100;

    if (roundedTotal === 0) {
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: 'Total ownership cannot be zero',
      };
    }

    if (roundedTotal < 100) {
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: `Ownership total is ${roundedTotal}%. Must equal exactly 100%. ${100 - roundedTotal}% remaining to allocate.`,
      };
    }

    if (roundedTotal > 100) {
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: `Ownership total is ${roundedTotal}%. Must equal exactly 100%. Reduce ownership by ${roundedTotal - 100}%.`,
      };
    }

    // Exactly 100%
    return {
      isValid: true,
      totalPercentage: roundedTotal,
    };
  }

  /**
   * Validates individual owner fields
   */
  static validateOwner(owner: Owner): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!owner.type || !['person', 'entity'].includes(owner.type)) {
      errors.push('Owner type must be person or entity');
    }

    if (owner.type === 'person') {
      if (!owner.firstName?.trim()) errors.push('First name is required');
      if (!owner.lastName?.trim()) errors.push('Last name is required');
      if (!owner.email?.trim()) errors.push('Email is required');
      if (!owner.phone?.trim()) errors.push('Phone is required');
    }

    if (owner.type === 'entity') {
      if (!owner.entityName?.trim()) errors.push('Entity name is required');
      if (!owner.countryOfIncorporation?.trim())
        errors.push('Country of incorporation is required');
      if (!owner.entityType?.trim()) errors.push('Entity type is required');
      if (!owner.registrationNumber?.trim()) errors.push('Registration number is required');
    }

    // Validate ownership percentage
    if (owner.ownershipPercentage === undefined || owner.ownershipPercentage === null) {
      errors.push('Ownership percentage is required');
    } else if (owner.ownershipPercentage < 0 || owner.ownershipPercentage > 100) {
      errors.push('Ownership percentage must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates the complete ownership structure
   */
  static validateCompleteOwnership(owners: Owner[]): {
    isValid: boolean;
    ownershipValidation: ValidationResult;
    ownerValidations: { owner: Owner; validation: { isValid: boolean; errors: string[] } }[];
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate total ownership
    const ownershipValidation = this.validateOwnership(owners);
    if (!ownershipValidation.isValid) {
      errors.push(ownershipValidation.error!);
    }

    // Validate individual owners
    const ownerValidations = owners.map(owner => ({
      owner,
      validation: this.validateOwner(owner),
    }));

    // Collect all owner validation errors
    ownerValidations.forEach(({ validation }) => {
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    });

    // Check for duplicate authorized signers (optional - just warning)
    const authorizedSigners = owners.filter(owner => owner.isAuthorizedSigner);
    if (authorizedSigners.length === 0) {
      warnings.push('At least one owner should be designated as an authorized signer');
    }

    return {
      isValid: errors.length === 0,
      ownershipValidation,
      ownerValidations,
      errors,
      warnings,
    };
  }

  /**
   * Checks if a form can be submitted based on ownership validation
   */
  static canSubmitForm(owners: Owner[]): boolean {
    const validation = this.validateCompleteOwnership(owners);
    return validation.isValid;
  }

  /**
   * Gets a user-friendly progress message
   */
  static getProgressMessage(owners: Owner[]): string {
    const validation = this.validateOwnership(owners);

    if (validation.isValid) {
      return '✅ Ownership allocation complete (100%)';
    }

    if (validation.totalPercentage < 100) {
      const remaining = 100 - validation.totalPercentage;
      return `📊 ${remaining}% remaining to allocate (${validation.totalPercentage}% allocated)`;
    }

    if (validation.totalPercentage > 100) {
      const excess = validation.totalPercentage - 100;
      return `⚠️ ${excess}% over allocated (${validation.totalPercentage}% total)`;
    }

    return '❌ Invalid ownership allocation';
  }

  /**
   * Calculates progress percentage for UI display
   */
  static getProgressPercentage(owners: Owner[]): number {
    const validation = this.validateOwnership(owners);
    return Math.min(Math.max(validation.totalPercentage, 0), 100);
  }

  /**
   * Gets progress bar color based on status
   */
  static getProgressColor(owners: Owner[]): 'green' | 'yellow' | 'red' {
    const validation = this.validateOwnership(owners);

    if (validation.isValid) return 'green';
    if (validation.totalPercentage > 100) return 'red';
    return 'yellow';
  }

  /**
   * Formats ownership percentage for display
   */
  static formatPercentage(percentage: number): string {
    return `${percentage}%`;
  }

  /**
   * Validates ownership change for existing clients
   */
  static validateOwnershipChange(
    currentOwners: Owner[],
    newOwners: Owner[]
  ): {
    isValid: boolean;
    errors: string[];
    requiresReKYC: boolean;
  } {
    const newValidation = this.validateCompleteOwnership(newOwners);

    // Check if ownership structure changed significantly
    const currentTotal = currentOwners.length;
    const newTotal = newOwners.length;
    const ownerCountChanged = currentTotal !== newTotal;

    // Check if any owner percentages changed by more than 25%
    const significantChange = currentOwners.some(current => {
      const matchingNew = newOwners.find(
        newOwner => newOwner.email === current.email || newOwner.id === current.id
      );
      if (!matchingNew) return true; // Owner removed

      const percentageDiff = Math.abs(
        current.ownershipPercentage - matchingNew.ownershipPercentage
      );
      return percentageDiff > 25; // More than 25% change
    });

    const requiresReKYC = ownerCountChanged || significantChange;

    return {
      isValid: newValidation.isValid,
      errors: newValidation.errors,
      requiresReKYC,
    };
  }
}
