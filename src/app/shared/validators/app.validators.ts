import { FormGroup, FormGroupDirective, ValidatorFn, Validators } from '@angular/forms';

export class AppValidators {
  static readonly personName: ValidatorFn = Validators.pattern(
    /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/,
  );

  static readonly label: ValidatorFn = Validators.pattern(
    /^[A-Za-z0-9]+(?:[ '\-][A-Za-z0-9]+)*$/,
  );

  static readonly password: ValidatorFn = Validators.pattern(/^\S{8,100}$/);

  static readonly optionalPassword: ValidatorFn = Validators.pattern(/^$|^\S{8,100}$/);

  /** Reset values and clear touched/dirty so validation UI does not linger after success. */
  static resetForm(
    form: FormGroup,
    values: Record<string, unknown>,
    formDirective?: FormGroupDirective,
  ): void {
    if (formDirective) {
      formDirective.resetForm(values);
    } else {
      form.reset(values);
    }

    form.markAsPristine();
    form.markAsUntouched();

    for (const control of Object.values(form.controls)) {
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity({ emitEvent: false });
    }
  }
}
