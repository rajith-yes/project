import { Injectable, inject, signal } from '@angular/core';
import { Observable, BehaviorSubject, from, map, tap, catchError, throwError, finalize, of } from 'rxjs';
import { User } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private loadingService = inject(LoadingService);
  private STORAGE_KEY = 'taskflow_current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUserSignal = signal<User | null>(this.getStoredUser());

  private getStoredUser(): User | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  login(username: string, password: string): Observable<User> {
    const cleanUsername = username ? username.trim().toLowerCase() : '';
    const cleanPassword = password ? password.trim() : '';

    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured. Please check environment variables.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .eq('password', cleanPassword)
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        const users = res.data as User[];
        const foundUser = users && users.length > 0 ? users[0] : null;
        if (foundUser) {
          const { password: _, ...userWithoutPass } = foundUser;
          this.setCurrentUser(userWithoutPass as User);
          return userWithoutPass as User;
        } else {
          throw new Error('Invalid username or password.');
        }
      }),
      catchError(err => throwError(() => err)),
      finalize(() => this.loadingService.hide())
    );
  }

  checkUsernameExists(username: string): Observable<boolean> {
    const cleanUsername = username ? username.trim().toLowerCase() : '';

    if (!this.supabase.client) {
      return of(false);
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
    ).pipe(
      map(res => {
        if (res.error) return false;
        return res.data && res.data.length > 0;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  signup(user: Omit<User, 'id'>): Observable<User> {
    const newUserId = Date.now().toString();
    const newUser = {
      id: newUserId,
      fullName: user.fullName,
      username: user.username,
      password: user.password
    };

    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured. Please check environment variables.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('users')
        .insert(newUser)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        const { password: _, ...userWithoutPass } = res.data as User;
        return userWithoutPass as User;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  updateProfile(userId: string, fullName: string): Observable<User> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured. Please check environment variables.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('users')
        .update({ fullName })
        .eq('id', userId)
        .select()
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        const updated = res.data as User;
        const current = this.currentUserValue;
        if (current && current.id === userId) {
          const newSessionUser = { ...current, fullName: updated.fullName };
          this.setCurrentUser(newSessionUser);
        }
        return updated;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  getUsers(): Observable<User[]> {
    if (!this.supabase.client) {
      return of([]);
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('users')
        .select('id, fullName, username')
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return (res.data || []) as User[];
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  getUserById(id: string): Observable<User> {
    if (!this.supabase.client) {
      return throwError(() => new Error('Supabase client is not configured. Please check environment variables.'));
    }

    this.loadingService.show();
    return from(
      this.supabase.client
        .from('users')
        .select('id, fullName, username')
        .eq('id', id)
        .single()
    ).pipe(
      map(res => {
        if (res.error) throw new Error(res.error.message);
        return res.data as User;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
  }
}
