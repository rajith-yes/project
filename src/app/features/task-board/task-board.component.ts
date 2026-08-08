import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { BoardService } from '../../core/services/board.service';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Board } from '../../core/models/board.model';
import { TaskItem, TaskStatus, TASK_STATUSES } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { BoardDialogComponent } from '../../shared/dialogs/board-dialog/board-dialog.component';
import { TaskDialogComponent } from '../../shared/dialogs/task-dialog/task-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss'
})
export class TaskBoardComponent implements OnInit {
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  boards: Board[] = [];
  activeBoardId: string = '';
  activeBoard: Board | null = null;
  tasks: TaskItem[] = [];
  filteredTasks: TaskItem[] = [];
  usersMap: Map<string, User> = new Map();
  usersList: User[] = [];

  columns: TaskStatus[] = TASK_STATUSES;
  searchQuery: string = '';
  filterDate: Date | null = null;

  selectedAssignees: string[] = [];
  selectedUnassigned: boolean = false;
  assigneeMenuSearchQuery: string = '';

  get filteredUsersList(): User[] {
    if (!this.assigneeMenuSearchQuery || !this.assigneeMenuSearchQuery.trim()) {
      return this.usersList;
    }
    const q = this.assigneeMenuSearchQuery.trim().toLowerCase();
    return this.usersList.filter(u => u.fullName && u.fullName.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadBoards();
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe(users => {
      this.usersList = users;
      users.forEach(u => this.usersMap.set(u.id, u));
    });
  }

  loadBoards(): void {
    // All taskboards created by any user are common and visible for everyone
    this.boardService.getBoards().subscribe({
      next: (boards) => {
        this.boards = boards;

        if (this.boards.length > 0) {
          if (!this.activeBoardId || !this.boards.find(b => b.id === this.activeBoardId)) {
            this.activeBoardId = this.boards[0].id;
          }
          this.onBoardChange();
        } else {
          this.activeBoardId = '';
          this.activeBoard = null;
          this.tasks = [];
          this.filteredTasks = [];
        }
      },
      error: () => {
        this.notification.showError('Failed to load boards from JSON Server.');
      }
    });
  }

  onBoardChange(): void {
    this.activeBoard = this.boards.find(b => b.id === this.activeBoardId) || null;
    if (this.activeBoardId) {
      this.loadTasksForBoard();
    }
  }

  loadTasksForBoard(): void {
    if (!this.activeBoardId) return;
    const currentUser = this.authService.currentUserValue;

    this.taskService.getTasksByBoard(this.activeBoardId).subscribe({
      next: (tasks) => {
        if (currentUser) {
          // Show tasks created by logged-in user OR assigned to logged-in user OR unassigned tasks
          this.tasks = tasks.filter(t => 
            t.createdBy === currentUser.id || 
            (t.assignees && t.assignees.includes(currentUser.id)) ||
            (!t.assignees || t.assignees.length === 0)
          );
        } else {
          this.tasks = tasks;
        }
        this.applyFilters();
      },
      error: () => {
        this.notification.showError('Failed to load tasks for selected board.');
      }
    });
  }

  applyFilters(): void {
    let result = [...this.tasks];

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(t => t.taskName.toLowerCase().includes(q));
    }

    if (this.filterDate) {
      const selectedStr = this.formatDateToYYYYMMDD(this.filterDate);
      result = result.filter(t => t.createdOn === selectedStr);
    }

    if (this.selectedAssignees.length > 0 || this.selectedUnassigned) {
      result = result.filter(t => {
        const isUnassignedTask = !t.assignees || t.assignees.length === 0;
        if (this.selectedUnassigned && isUnassignedTask) {
          return true;
        }
        if (t.assignees && t.assignees.some(uId => this.selectedAssignees.includes(uId))) {
          return true;
        }
        return false;
      });
    }

    this.filteredTasks = result;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterDate = null;
    this.selectedAssignees = [];
    this.selectedUnassigned = false;
    this.applyFilters();
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

  isAssigneeSelected(userId: string): boolean {
    return this.selectedAssignees.includes(userId);
  }

  toggleUnassigned(): void {
    this.selectedUnassigned = !this.selectedUnassigned;
    this.applyFilters();
  }

  clearAssigneeFilter(event: Event): void {
    event.stopPropagation();
    this.selectedAssignees = [];
    this.selectedUnassigned = false;
    this.applyFilters();
  }

  get totalAssigneeFilterCount(): number {
    return this.selectedAssignees.length + (this.selectedUnassigned ? 1 : 0);
  }

  onPickerClosed(): void {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  getVisibleAssignees(assignees: string[] | undefined): string[] {
    if (!assignees) return [];
    return assignees.slice(0, 3);
  }

  getExtraAssigneesCount(assignees: string[] | undefined): number {
    if (!assignees || assignees.length <= 3) return 0;
    return assignees.length - 3;
  }

  getExtraAssigneesTooltip(assignees: string[] | undefined): string {
    if (!assignees || assignees.length <= 3) return '';
    const extraIds = assignees.slice(3);
    return 'Also assigned to: ' + extraIds.map(id => this.getUserName(id)).join(', ');
  }

  getTasksForColumn(col: TaskStatus): TaskItem[] {
    return this.filteredTasks.filter(t => t.status === col);
  }

  onDrop(event: CdkDragDrop<TaskItem[]>, newStatus: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const draggedTask = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      draggedTask.status = newStatus;
      this.taskService.updateTaskStatus(draggedTask.id, newStatus).subscribe({
        next: () => {
          this.notification.showInfo(`Task moved to "${newStatus}"`);
        },
        error: () => {
          this.notification.showError('Failed to update task status on server.');
          this.loadTasksForBoard();
        }
      });
    }
  }

  openCreateBoardDialog(): void {
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '440px',
      data: { title: 'Create New Board', existingBoards: this.boards, submitText: 'Create Board' }
    });

    dialogRef.afterClosed().subscribe((name: string) => {
      if (name) {
        const currentUser = this.authService.currentUserValue;
        this.boardService.createBoard(name, currentUser?.id || '1').subscribe({
          next: (newBoard) => {
            this.notification.showSuccess(`Board "${newBoard.name}" created!`);
            this.boards.push(newBoard);
            this.activeBoardId = newBoard.id;
            this.onBoardChange();
          },
          error: () => this.notification.showError('Failed to create board.')
        });
      }
    });
  }

  openRenameBoardDialog(): void {
    if (!this.activeBoard) return;
    const dialogRef = this.dialog.open(BoardDialogComponent, {
      width: '440px',
      data: { title: 'Rename Board', name: this.activeBoard.name, existingBoards: this.boards, submitText: 'Save Name' }
    });

    dialogRef.afterClosed().subscribe((name: string) => {
      if (name && this.activeBoard) {
        this.boardService.updateBoard(this.activeBoard.id, name).subscribe({
          next: (updated) => {
            this.notification.showSuccess('Board renamed!');
            this.activeBoard!.name = updated.name;
            const b = this.boards.find(item => item.id === updated.id);
            if (b) b.name = updated.name;
          },
          error: () => this.notification.showError('Failed to rename board.')
        });
      }
    });
  }

  confirmDeleteBoard(): void {
    if (!this.activeBoard) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Board',
        message: `Are you sure you want to delete board "${this.activeBoard.name}" and all its tasks? This action cannot be undone.`,
        confirmText: 'Delete Board',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed && this.activeBoard) {
        const idToDelete = this.activeBoard.id;
        this.taskService.deleteTasksByBoard(idToDelete).subscribe(() => {
          this.boardService.deleteBoard(idToDelete).subscribe({
            next: () => {
              this.notification.showSuccess('Board deleted.');
              this.loadBoards();
            },
            error: () => this.notification.showError('Failed to delete board.')
          });
        });
      }
    });
  }

  openCreateTaskDialog(): void {
    if (!this.activeBoardId) return;
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { title: 'Create New Task', boardId: this.activeBoardId, submitText: 'Create Task' }
    });

    dialogRef.afterClosed().subscribe((taskData) => {
      if (taskData) {
        const currentUser = this.authService.currentUserValue;
        const newTaskData: Omit<TaskItem, 'id'> = {
          boardId: this.activeBoardId,
          taskName: taskData.taskName,
          description: taskData.description || '',
          status: taskData.status,
          assignees: taskData.assignees || [],
          createdBy: currentUser?.id || '1',
          createdOn: this.formatDateToYYYYMMDD(new Date())
        };

        this.taskService.createTask(newTaskData).subscribe({
          next: (created) => {
            this.notification.showSuccess('Task created!');
            this.tasks.push(created);
            this.applyFilters();
          },
          error: () => this.notification.showError('Failed to create task.')
        });
      }
    });
  }

  openEditTaskDialog(task: TaskItem): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { title: 'Edit Task', boardId: task.boardId, task, submitText: 'Update Task' }
    });

    dialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        this.taskService.updateTask(task.id, updatedData).subscribe({
          next: (updatedTask) => {
            this.notification.showSuccess('Task updated!');
            const idx = this.tasks.findIndex(t => t.id === task.id);
            if (idx !== -1) {
              this.tasks[idx] = updatedTask;
            }
            this.applyFilters();
          },
          error: () => this.notification.showError('Failed to update task.')
        });
      }
    });
  }

  confirmDeleteTask(task: TaskItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete task "${task.taskName}"?`,
        confirmText: 'Delete Task',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.notification.showSuccess('Task deleted.');
            this.tasks = this.tasks.filter(t => t.id !== task.id);
            this.applyFilters();
          },
          error: () => this.notification.showError('Failed to delete task.')
        });
      }
    });
  }

  getUserName(id: string): string {
    const user = this.usersMap.get(id);
    return user ? user.fullName : 'Unknown User';
  }

  getUserInitial(id: string): string {
    const user = this.usersMap.get(id);
    return user && user.fullName ? user.fullName.charAt(0).toUpperCase() : '?';
  }

  getColumnBadgeClass(col: TaskStatus): string {
    switch (col) {
      case 'Backlog': return 'bg-slate-400';
      case 'Todo': return 'bg-sky-500';
      case 'In Progress': return 'bg-amber-500';
      case 'In Testing': return 'bg-purple-500';
      case 'Completed': return 'bg-emerald-500';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDateToYYYYMMDD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  trackByTaskId(index: number, task: TaskItem): string {
    return task.id;
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
}

