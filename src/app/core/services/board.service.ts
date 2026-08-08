import { Injectable, inject } from '@angular/core';
import { Observable, from, map, finalize, of, throwError } from 'rxjs';
import { Board } from '../models/board.model';
import { SupabaseService } from './supabase.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private supabase = inject(SupabaseService);
  private loadingService = inject(LoadingService);

  getBoards(): Observable<Board[]> {
    if (!this.supabase.client) {
      return of([]);
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('boards')
        .select('*')
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return (res.data || []) as Board[];
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  getBoardsByUser(userId: string): Observable<Board[]> {
    if (!this.supabase.client) {
      return of([]);
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('boards')
        .select('*')
        .eq('createdBy', userId)
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return (res.data || []) as Board[];
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  getBoardById(id: string): Observable<Board> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as Board;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  createBoard(name: string, createdBy: string): Observable<Board> {
    const newBoard: Board = {
      id: Date.now().toString(),
      name,
      createdBy
    };

    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('boards')
        .insert(newBoard)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as Board;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  updateBoard(id: string, name: string): Observable<Board> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('boards')
        .update({ name })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as Board;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  deleteBoard(id: string): Observable<void> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('boards')
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
}
