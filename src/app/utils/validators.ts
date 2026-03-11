import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function pastDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return { invalidDate: true };
    const today = new Date();
    // clear time for comparison
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today ? null : { notInPast: true };
  };
}
