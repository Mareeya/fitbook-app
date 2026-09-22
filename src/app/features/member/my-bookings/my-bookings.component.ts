import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingResponse } from '../../bookings/models/booking.models';
import { BookingsService } from '../../bookings/services/bookings.service';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { formatSessionDateTime } from '../../../shared/helpers/api-datetime';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-my-bookings',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss',
})
export class MyBookingsComponent implements OnInit {
  private readonly bookingsService = inject(BookingsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  bookings: BookingResponse[] = [];
  isLoading = false;
  loadError = '';
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  cancellingBookingId: number | null = null;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.loadError = '';

    this.bookingsService
      .getMine({ page: this.pageIndex + 1, pageSize: this.pageSize })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (page) => {
          this.bookings = page.items;
          this.total = page.total;
        },
        error: (error: HttpErrorResponse) => {
          this.loadError = apiErrorMessage(error, 'Cannot load your bookings.');
          showAppSnack(this.snackBar, this.loadError, 'error');
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBookings();
  }

  whenLabels(booking: BookingResponse): string {
    const { dateLabel, timeLabel } = formatSessionDateTime(booking.startAt);
    return `${dateLabel} · ${timeLabel}`;
  }

  canCancel(booking: BookingResponse): boolean {
    return booking.bookingStatus.toLowerCase() !== 'cancelled';
  }

  cancelBooking(booking: BookingResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        title: 'Cancel booking',
        message: `Release your spot for ${booking.className}?`,
        confirmText: 'Cancel booking',
        cancelText: 'Keep booking',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.cancellingBookingId = booking.id;
      this.bookingsService
        .cancel(booking.id)
        .pipe(
          finalize(() => {
            this.cancellingBookingId = null;
          }),
        )
        .subscribe({
          next: (updated) => {
            this.bookings = this.bookings.map((item) => (item.id === updated.id ? updated : item));
            showAppSnack(this.snackBar, 'Booking cancelled. You can book this session again.');
          },
          error: (error: HttpErrorResponse) => {
            showAppSnack(this.snackBar, apiErrorMessage(error, 'Could not cancel booking.'), 'error');
          },
        });
    });
  }
}
