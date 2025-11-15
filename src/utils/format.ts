interface ValidationIssue {
  message: string;
}

interface ValidationErrors {
  issues?: ValidationIssue[];
}

export const formatValidationError = (errors: ValidationErrors | null | undefined): string => {
  if (!errors || !errors.issues) return 'Validation failed';

  if (Array.isArray(errors.issues))
    return errors.issues.map(i => i.message).join(', ');

  return JSON.stringify(errors);
};