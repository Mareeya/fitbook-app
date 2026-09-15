import { ValidatorFn, Validators } from '@angular/forms';

export class AppValidators {
  static readonly personName: ValidatorFn = Validators.pattern(
    /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/,
  );

  static readonly label: ValidatorFn = Validators.pattern(
    /^[A-Za-z0-9]+(?:[ '\-][A-Za-z0-9]+)*$/,
  );

  static readonly password: ValidatorFn = Validators.pattern(/^\S{8,100}$/);

  static readonly optionalPassword: ValidatorFn = Validators.pattern(/^$|^\S{8,100}$/);
}
