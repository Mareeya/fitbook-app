import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, forkJoin } from 'rxjs';
import { apiErrorMessage } from '../../../shared/helpers/api-error';
import { GymClassResponse } from '../classes-page/models/gym-class-response.model';
import { ClassesService } from '../classes-page/services/classes.service';
import { TrainersService } from '../trainers-page/services/trainers.service';
import {
  DashboardSummaryResponse,
  TodaySessionResponse,
} from './models/dashboard.models';
import { DashboardService } from './services/dashboard.service';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  dasharray: string;
  offset: number;
}

interface BarItem {
  label: string;
  value: number;
  heightPct: number;
  tone: 'peak' | 'warn' | 'ink';
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly classesService = inject(ClassesService);
  private readonly trainersService = inject(TrainersService);
  private readonly dashboardService = inject(DashboardService);

  isLoading = false;
  loadError = '';
  summary: DashboardSummaryResponse | null = null;
  todaySessions: TodaySessionResponse[] = [];
  classes: GymClassResponse[] = [];
  trainerCount = 0;
  occupancyPercent = 0;
  sessionsThisMonth = 0;
  occupancySlices: DonutSlice[] = [];
  categorySlices: DonutSlice[] = [];
  categoryTotal = 0;
  sessionBars: BarItem[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      summary: this.dashboardService.getSummary(),
      today: this.dashboardService.getToday(),
      classes: this.classesService.getAll(),
      trainers: this.trainersService.getAll(),
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: ({ summary, today, classes, trainers }) => {
        this.summary = summary;
        this.todaySessions = [...today].sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        );
        this.classes = [...classes].sort((a, b) => b.averageFillRate - a.averageFillRate);
        this.trainerCount = trainers.length;
        this.occupancyPercent = summary.utilization;
        this.buildCharts();
      },
      error: (error: HttpErrorResponse) => {
        this.loadError = apiErrorMessage(error, 'Could not load dashboard statistics.');
      },
    });
  }

  fillTone(percent: number): 'signal' | 'heat' | 'dim' {
    if (percent >= 80) {
      return 'heat';
    }
    if (percent <= 0) {
      return 'dim';
    }
    return 'signal';
  }

  private buildCharts(): void {
    const withSessions = this.classes.filter((item) => item.sessionsThisMonth > 0);
    const fillSource = withSessions.length > 0 ? withSessions : this.classes;
    const classAvgFill =
      fillSource.length === 0
        ? 0
        : Math.round(
            fillSource.reduce((sum, item) => sum + item.averageFillRate, 0) / fillSource.length,
          );

    const occupancy = this.summary?.utilization ?? classAvgFill;
    this.occupancyPercent = occupancy;
    this.sessionsThisMonth = this.classes.reduce((sum, item) => sum + item.sessionsThisMonth, 0);
    this.occupancySlices = this.toSlices([
      { label: 'Filled', value: occupancy, color: '#2d6a4f' },
      { label: 'Open', value: Math.max(0, 100 - occupancy), color: '#e2ebe6' },
    ]);

    const byCategory = new Map<string, number>();
    for (const gymClass of this.classes) {
      const key = gymClass.categoryName || 'Other';
      const weight = gymClass.sessionsThisMonth > 0 ? gymClass.sessionsThisMonth : 1;
      byCategory.set(key, (byCategory.get(key) ?? 0) + weight);
    }

    const categoryRows = [...byCategory.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    const categoryColors = ['#2d6a4f', '#40916c', '#52b788'];
    this.categoryTotal = categoryRows.reduce((sum, row) => sum + row.value, 0);
    this.categorySlices = this.toSlices(
      categoryRows.map((row, index) => ({
        ...row,
        color: categoryColors[index] ?? 'var(--text)',
      })),
    );

    const maxSessions = Math.max(...this.classes.map((item) => item.sessionsThisMonth), 0);
    this.sessionBars = this.classes.map((gymClass) => {
      const isPeak = maxSessions > 0 && gymClass.sessionsThisMonth === maxSessions;
      return {
        label: gymClass.name,
        value: gymClass.sessionsThisMonth,
        heightPct: maxSessions === 0 ? 0 : Math.round((gymClass.sessionsThisMonth / maxSessions) * 100),
        tone: isPeak ? 'peak' : gymClass.averageFillRate >= 80 ? 'warn' : 'ink',
      };
    });
  }

  private toSlices(
    rows: { label: string; value: number; color: string }[],
  ): DonutSlice[] {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    if (total <= 0) {
      return [];
    }

    let offset = 0;
    return rows.map((row) => {
      const percent = Math.round((row.value / total) * 100);
      const slice: DonutSlice = {
        label: row.label,
        value: row.value,
        color: row.color,
        dasharray: `${percent} ${100 - percent}`,
        offset,
      };
      offset += percent;
      return slice;
    });
  }
}
