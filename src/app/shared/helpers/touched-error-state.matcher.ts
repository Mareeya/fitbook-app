import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/** Show Material error styling only after the user touched the field (not after form submit alone). */
export class TouchedErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    _form: FormGroupDirective | NgForm | null,
  ): boolean {
    return !!(control && control.invalid && control.touched);
  }
}
