import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskItem, TaskStatus, TASK_STATUSES } from '../../../../app/core/models/task.model';
import { User } from '../../../../app/core/models/user.model';
import { AuthService } from '../../../../app/core/services/auth.service';

export interface TaskDialogData {
  title: string;
  boardId: string;
  task?: Partial<TaskItem>;
  submitText?: string;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss'
})
export class TaskDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('avatarContainer') avatarContainer?: ElementRef<HTMLDivElement>;

  form: FormGroup;
  statuses = TASK_STATUSES;
  users: User[] = [];
  maxVisibleAvatars: number = 4;
  assigneeSearchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {
    const task = data.task;
    const currentUser = this.authService.currentUserValue;
    // Default logged-in user as assignee for new task creation
    const initialAssignees = task ? (task.assignees || []) : (currentUser ? [currentUser.id] : []);

    this.form = this.fb.group({
      taskName: [task?.taskName || '', [Validators.required, Validators.minLength(3)]],
      description: [task?.description || ''],
      status: [task?.status || 'Todo', [Validators.required]],
      assignees: [initialAssignees]
    });
  }

  ngOnInit(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        setTimeout(() => this.calculateMaxAvatars(), 50);
      }
    });

    this.form.get('assignees')?.valueChanges.subscribe(() => {
      setTimeout(() => this.calculateMaxAvatars(), 0);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.calculateMaxAvatars(), 50);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateMaxAvatars();
  }

  get filteredUsers(): User[] {
    if (!this.assigneeSearchQuery || !this.assigneeSearchQuery.trim()) {
      return this.users;
    }
    const q = this.assigneeSearchQuery.trim().toLowerCase();
    return this.users.filter(u => u.fullName && u.fullName.toLowerCase().includes(q));
  }

  calculateMaxAvatars(): void {
    if (!this.avatarContainer?.nativeElement) return;
    const containerWidth = this.avatarContainer.nativeElement.clientWidth;
    const selectedCount = this.getSelectedUsers().length;
    if (selectedCount <= 1) {
      this.maxVisibleAvatars = Math.max(1, selectedCount);
      return;
    }

    const totalNeededForArray = 28 + (selectedCount - 1) * 20;

    if (totalNeededForArray <= containerWidth) {
      this.maxVisibleAvatars = selectedCount;
    } else {
      const availableForVisible = containerWidth - 36;
      const fitCount = Math.floor((availableForVisible - 8) / 20);
      this.maxVisibleAvatars = Math.max(1, fitCount);
    }
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

  selectStatus(status: TaskStatus): void {
    this.form.get('status')?.setValue(status);
    this.form.get('status')?.markAsDirty();
  }

  isUserSelected(userId: string): boolean {
    const current: string[] = this.form.get('assignees')?.value || [];
    return current.includes(userId);
  }

  toggleUserAssignee(userId: string): void {
    const current: string[] = [...(this.form.get('assignees')?.value || [])];
    const idx = current.indexOf(userId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(userId);
    }
    this.form.get('assignees')?.setValue(current);
    this.form.get('assignees')?.markAsDirty();
  }

  getSelectedUsers(): User[] {
    const selectedIds: string[] = this.form.get('assignees')?.value || [];
    return this.users.filter(u => selectedIds.includes(u.id));
  }

  getVisibleAssignees(): User[] {
    return this.getSelectedUsers().slice(0, this.maxVisibleAvatars);
  }

  getRemainingAssigneeCount(): number {
    const total = this.getSelectedUsers().length;
    return total > this.maxVisibleAvatars ? total - this.maxVisibleAvatars : 0;
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

  getUserInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
