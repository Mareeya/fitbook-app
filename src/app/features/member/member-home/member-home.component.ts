import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { showAppSnack } from '../../../shared/helpers/app-snackbar';
import { UserRole } from '../../auth/models/user-role.enum';
import { AuthService } from '../../auth/services/auth.service';

type BookingStatus = 'booked' | 'attended' | 'cancelled';
type SpotStatus = 'open' | 'almost' | 'booked';

interface WeekBooking {
  id: number;
  dateLabel: string;
  timeLabel: string;
  name: string;
  coach: string;
  studio: string;
  status: BookingStatus;
}

interface OpenSpot {
  id: number;
  timeLabel: string;
  name: string;
  coach: string;
  duration: string;
  taken: number;
  capacity: number;
  status: SpotStatus;
  alreadyBooked: boolean;
}

interface CategorySlice {
  label: string;
  value: number;
  color: string;
  dasharray: string;
  offset: number;
}

interface WeekBar {
  label: string;
  value: number;
  heightPct: number;
  isPeak: boolean;
}

@Component({
  selector: 'app-member-home',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './member-home.component.html',
  styleUrl: './member-home.component.scss',
})
export class MemberHomeComponent {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.currentUser;
  isLoading = false;
  loadError = '';

  bookings: WeekBooking[] = [
    {
      id: 1,
      dateLabel: 'Tue 9 Sep',
      timeLabel: '17:30',
      name: 'Conditioning',
      coach: 'Coach Mia',
      studio: 'Studio A',
      status: 'booked',
    },
    {
      id: 2,
      dateLabel: 'Thu 11 Sep',
      timeLabel: '07:15',
      name: 'Metcon 45',
      coach: 'Coach Ali',
      studio: 'Studio B',
      status: 'booked',
    },
    {
      id: 3,
      dateLabel: 'Sat 6 Sep',
      timeLabel: '09:30',
      name: 'Vinyasa Flow',
      coach: 'Coach Dana',
      studio: 'Studio A',
      status: 'attended',
    },
    {
      id: 4,
      dateLabel: 'Fri 5 Sep',
      timeLabel: '18:45',
      name: 'Strength Block',
      coach: 'Cancelled by studio · Coach Ravi off',
      studio: '',
      status: 'cancelled',
    },
  ];

  openSpots: OpenSpot[] = [
    {
      id: 1,
      timeLabel: '17:30',
      name: 'Conditioning',
      coach: 'Coach Mia',
      duration: '45 min',
      taken: 16,
      capacity: 20,
      status: 'almost',
      alreadyBooked: true,
    },
    {
      id: 2,
      timeLabel: '18:45',
      name: 'Strength Block',
      coach: 'Coach Ravi',
      duration: '60 min',
      taken: 9,
      capacity: 20,
      status: 'open',
      alreadyBooked: false,
    },
    {
      id: 3,
      timeLabel: '20:00',
      name: 'Open Gym',
      coach: 'Unstaffed',
      duration: '60 min',
      taken: 5,
      capacity: 20,
      status: 'open',
      alreadyBooked: false,
    },
  ];

  attendanceRate = 75;
  attendanceNote = 'Showed up for 6 of the 8 classes you booked';
  categorySlices: CategorySlice[] = [
    { label: 'Yoga', value: 4, color: 'var(--primary)', dasharray: '50 50', offset: 0 },
    { label: 'Cardio', value: 2, color: 'var(--warning)', dasharray: '25 75', offset: 50 },
    { label: 'Strength', value: 2, color: 'var(--fill-dim)', dasharray: '25 75', offset: 75 },
  ];
  categoryTotal = 8;
  weekBars: WeekBar[] = [
    { label: 'W31', value: 2, heightPct: 50, isPeak: false },
    { label: 'W32', value: 3, heightPct: 75, isPeak: false },
    { label: 'W33', value: 1, heightPct: 25, isPeak: false },
    { label: 'W34', value: 4, heightPct: 100, isPeak: true },
    { label: 'W35', value: 2, heightPct: 50, isPeak: false },
    { label: 'W36', value: 3, heightPct: 75, isPeak: false },
  ];

  get displayName(): string {
    return this.user()?.name || 'Member';
  }

  roleLabel(): string {
    if (this.user()?.role === UserRole.Member) {
      return 'Member';
    }

    return 'Guest';
  }

  get bookedThisWeek(): number {
    return this.bookings.filter((item) => item.status === 'booked').length;
  }

  get nextBooking(): WeekBooking | undefined {
    return this.bookings.find((item) => item.status === 'booked');
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  }

  statusLabel(status: BookingStatus): string {
    if (status === 'booked') {
      return 'Booked';
    }
    if (status === 'attended') {
      return 'Attended';
    }
    return 'Cancelled';
  }

  remaining(spot: OpenSpot): number {
    return Math.max(0, spot.capacity - spot.taken);
  }

  fillPercent(spot: OpenSpot): number {
    if (spot.capacity <= 0) {
      return 0;
    }
    return Math.round((spot.taken / spot.capacity) * 100);
  }

  retry(): void {
    this.loadError = '';
    this.isLoading = false;
  }

  viewBooking(booking: WeekBooking): void {
    showAppSnack(this.snackBar, `${booking.name} at ${booking.timeLabel} · booking API is not connected yet.`);
  }

  cancelBooking(booking: WeekBooking): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        title: 'Cancel booking',
        message: `Cancel ${booking.name} at ${booking.timeLabel}?`,
        confirmText: 'Cancel class',
        cancelText: 'Keep booking',
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      showAppSnack(this.snackBar, 'Booking is not available yet.', 'error');
    });
  }

  bookSpot(spot: OpenSpot): void {
    if (spot.alreadyBooked) {
      showAppSnack(this.snackBar, 'You already have this class.');
      return;
    }

    showAppSnack(this.snackBar, 'Booking is not available yet.', 'error');
  }
}
