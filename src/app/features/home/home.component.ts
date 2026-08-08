import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { BoardService } from '../../core/services/board.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);

  totalTasks = 0;
  inProgressTasks = 0;
  completedTasks = 0;
  totalBoards = 0;

  get currentUser() {
    return this.authService.currentUserSignal();
  }

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    forkJoin({
      allTasks: this.taskService.getTasks(),
      boards: this.boardService.getBoards()
    }).subscribe(({ allTasks, boards }) => {
      const assignedTasks = allTasks.filter(t => 
        t.assignees && Array.isArray(t.assignees) && t.assignees.includes(currentUser.id)
      );

      this.totalTasks = assignedTasks.length;
      this.inProgressTasks = assignedTasks.filter(t => t.status === 'In Progress').length;
      this.completedTasks = assignedTasks.filter(t => t.status === 'Completed').length;

      const userBoardIds = new Set(allTasks.filter(t => 
        t.createdBy === currentUser.id || (t.assignees && t.assignees.includes(currentUser.id))
      ).map(t => t.boardId));

      const userBoards = boards.filter(b => b.createdBy === currentUser.id || userBoardIds.has(b.id));
      this.totalBoards = userBoards.length;
    });
  }
}
