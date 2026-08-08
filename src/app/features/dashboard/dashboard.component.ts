import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { 
  MatTableModule, 
  MatTableDataSource, 
  MatCellDef, 
  MatHeaderCellDef, 
  MatColumnDef, 
  MatHeaderRowDef, 
  MatRowDef, 
  MatNoDataRow 
} from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { TaskItem, TaskStatus, TASK_STATUSES } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatCellDef,
    MatHeaderCellDef,
    MatColumnDef,
    MatHeaderRowDef,
    MatRowDef,
    MatNoDataRow,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  rawTasks: TaskItem[] = [];
  users: User[] = [];
  usersMap: Map<string, User> = new Map();

  statuses = TASK_STATUSES;
  displayedColumns: string[] = ['id', 'taskName', 'status', 'assignees', 'createdBy', 'createdOn'];
  dataSource = new MatTableDataSource<TaskItem>([]);

  filterDate: Date | null = null;
  selectedAssignees: string[] = [];
  selectedUnassigned: boolean = false;
  assigneeMenuSearchQuery: string = '';
  selectedStatuses: TaskStatus[] = [];

  chart: Chart | null = null;
  chartCounts: { status: string; count: number }[] = [];

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  get totalAssigneeFilterCount(): number {
    return this.selectedAssignees.length + (this.selectedUnassigned ? 1 : 0);
  }

  get totalStatusFilterCount(): number {
    return this.selectedStatuses.length;
  }

  get filteredUsersList(): User[] {
    if (!this.assigneeMenuSearchQuery || !this.assigneeMenuSearchQuery.trim()) {
      return this.users;
    }
    const q = this.assigneeMenuSearchQuery.trim().toLowerCase();
    return this.users.filter(u => u.fullName && u.fullName.toLowerCase().includes(q));
  }

  loadDashboardData(): void {
    forkJoin({
      users: this.authService.getUsers(),
      tasks: this.taskService.getTasks()
    }).subscribe(({ users, tasks }) => {
      this.users = users;
      users.forEach(u => this.usersMap.set(u.id, u));

      this.rawTasks = tasks;
      this.applyFilters();
    });
  }

  isAssigneeSelected(userId: string): boolean {
    return this.selectedAssignees.includes(userId);
  }

  toggleAssignee(userId: string): void {
    const idx = this.selectedAssignees.indexOf(userId);
    if (idx > -1) {
      this.selectedAssignees.splice(idx, 1);
    } else {
      this.selectedAssignees.push(userId);
    }
    this.applyFilters();
  }

  toggleUnassigned(): void {
    this.selectedUnassigned = !this.selectedUnassigned;
    this.applyFilters();
  }

  clearAssigneeFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedAssignees = [];
    this.selectedUnassigned = false;
    this.assigneeMenuSearchQuery = '';
    this.applyFilters();
  }

  isStatusSelected(status: TaskStatus): boolean {
    return this.selectedStatuses.includes(status);
  }

  toggleStatus(status: TaskStatus): void {
    const idx = this.selectedStatuses.indexOf(status);
    if (idx > -1) {
      this.selectedStatuses.splice(idx, 1);
    } else {
      this.selectedStatuses.push(status);
    }
    this.applyFilters();
  }

  clearStatusFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedStatuses = [];
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Backlog': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Todo': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Testing': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  getStatusDotColor(status: string): string {
    switch (status) {
      case 'Backlog': return '#64748b';
      case 'Todo': return '#0284c7';
      case 'In Progress': return '#d97706';
      case 'In Testing': return '#7c3aed';
      case 'Completed': return '#059669';
      default: return '#64748b';
    }
  }

  onPickerClosed(): void {
    // Retain focus or filter state
  }

  applyFilters(): void {
    let result = [...this.rawTasks];
    const currentUser = this.authService.currentUserValue;

    // Filter by Assignees if selected
    if (this.totalAssigneeFilterCount > 0) {
      result = result.filter(t => {
        const hasSelectedAssignee = t.assignees && t.assignees.some(id => this.selectedAssignees.includes(id));
        const isUnassignedMatch = this.selectedUnassigned && (!t.assignees || t.assignees.length === 0);
        return hasSelectedAssignee || isUnassignedMatch;
      });
    } else if (currentUser) {
      // Default to tasks created by or assigned to logged-in user if no custom assignee filter active
      result = result.filter(t => 
        t.createdBy === currentUser.id || 
        (t.assignees && t.assignees.includes(currentUser.id)) ||
        (!t.assignees || t.assignees.length === 0)
      );
    }

    if (this.filterDate) {
      const dateStr = this.formatDateToYYYYMMDD(this.filterDate);
      result = result.filter(t => t.createdOn === dateStr);
    }

    if (this.selectedStatuses.length > 0) {
      result = result.filter(t => this.selectedStatuses.includes(t.status));
    }

    this.dataSource.data = result;
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;

    this.updatePieChart(result);
  }

  clearFilters(): void {
    this.filterDate = null;
    this.selectedAssignees = [];
    this.selectedUnassigned = false;
    this.assigneeMenuSearchQuery = '';
    this.selectedStatuses = [];
    this.applyFilters();
  }

  updatePieChart(tasks: TaskItem[]): void {
    const counts = this.statuses.map(s => {
      return {
        status: s,
        count: tasks.filter(t => t.status === s).length
      };
    });

    this.chartCounts = counts;

    if (!this.pieCanvas) return;

    const ctx = this.pieCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: counts.map(c => c.status),
        datasets: [{
          data: counts.map(c => c.count),
          backgroundColor: [
            '#64748b',
            '#0284c7',
            '#d97706',
            '#9333ea',
            '#16a34a'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { family: 'Inter', size: 12 }
            }
          }
        }
      }
    });
  }

  getStatusClass(status: TaskStatus): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  getUserName(id: string): string {
    const u = this.usersMap.get(id);
    return u ? u.fullName : 'Unknown';
  }

  getUserInitial(id: string): string {
    const u = this.usersMap.get(id);
    return u && u.fullName ? u.fullName.charAt(0).toUpperCase() : '?';
  }

  getVisibleAssigneeIds(assignees: string[]): string[] {
    if (!assignees || !Array.isArray(assignees)) return [];
    return assignees.slice(0, 4);
  }

  getRemainingAssigneeCount(assignees: string[]): number {
    if (!assignees || !Array.isArray(assignees)) return 0;
    return assignees.length > 4 ? assignees.length - 4 : 0;
  }

  getAvatarColor(name: string): string {
    if (!name) return '#64748b';
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  formatDateToYYYYMMDD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
