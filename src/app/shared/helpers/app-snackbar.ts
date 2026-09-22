import { MatSnackBar } from '@angular/material/snack-bar';

export function showAppSnack(
  snackBar: MatSnackBar,
  message: string,
  kind: 'success' | 'error' = 'success',
): void {
  snackBar.open(message, 'Close', {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: kind === 'error' ? 'fb-snack-error' : 'fb-snack-success',
  });
}
