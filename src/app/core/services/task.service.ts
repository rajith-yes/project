import { Injectable, inject } from '@angular/core';
import { Observable, from, map, finalize, of, throwError } from 'rxjs';
import { TaskItem, TaskStatus } from '../models/task.model';
import { SupabaseService } from './supabase.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private supabase = inject(SupabaseService);
  private loadingService = inject(LoadingService);

  getTasks(): Observable<TaskItem[]> {
    if (!this.supabase.client) {
      return of([]);
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return (res.data || []) as TaskItem[];
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  getTasksByBoard(boardId: string): Observable<TaskItem[]> {
    if (!this.supabase.client) {
      return of([]);
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('boardId', boardId)
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return (res.data || []) as TaskItem[];
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  createTask(taskData: Omit<TaskItem, 'id'>): Observable<TaskItem> {
    const newTask: TaskItem = {
      ...taskData,
      id: Date.now().toString()
    };

    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .insert(newTask)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as TaskItem;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  updateTask(id: string, taskData: Partial<TaskItem>): Observable<TaskItem> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .update(taskData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as TaskItem;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  updateTaskStatus(id: string, status: TaskStatus): Observable<TaskItem> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as TaskItem;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  deleteTask(id: string): Observable<void> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .delete()
        .eq('id', id)
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return undefined;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  deleteTasksByBoard(boardId: string): Observable<void[]> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('tasks')
        .delete()
        .eq('boardId', boardId)
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return [];
      }),
      finalize(() => this.loadingService.hide())
    );
  }
}
