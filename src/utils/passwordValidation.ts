export class PasswordValidator {
  static hasUpperCase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  static hasLowerCase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  static hasDigits(password: string): boolean {
    return /[0-9]/.test(password);
  }

  static hasSpecialCharacters(password: string): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  static hasMinLength(password: string, minLength: number): boolean {
    return password.length >= minLength;
  }

  static getPasswordRequirements() {
    return [
      { label: 'At least 8 characters long', check: (p: string) => this.hasMinLength(p, 8) },
      { label: 'Contains at least one uppercase letter', check: (p: string) => this.hasUpperCase(p) },
      { label: 'Contains at least one lowercase letter', check: (p: string) => this.hasLowerCase(p) },
      { label: 'Contains at least one number', check: (p: string) => this.hasDigits(p) },
      { label: 'Contains at least one special character', check: (p: string) => this.hasSpecialCharacters(p) },
    ];
  }

  static getPasswordValidationErrors(password: string): string[] {
    const errors: string[] = [];

    if (!this.hasMinLength(password, 8)) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!this.hasUpperCase(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!this.hasLowerCase(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!this.hasDigits(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!this.hasSpecialCharacters(password)) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  }
}
