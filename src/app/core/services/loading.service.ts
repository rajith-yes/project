import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private autoResetTimer: any = null;

  public isLoading$ = this.isLoadingSubject.asObservable();
  public isLoadingSignal = signal<boolean>(false);

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.isLoadingSubject.next(true);
      this.isLoadingSignal.set(true);
    }
    this.scheduleAutoReset();
  }

  hide(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    if (this.activeRequests === 0) {
      this.clearAutoReset();
      this.isLoadingSubject.next(false);
      this.isLoadingSignal.set(false);
    }
  }

  reset(): void {
    this.clearAutoReset();
    this.activeRequests = 0;
    this.isLoadingSubject.next(false);
    this.isLoadingSignal.set(false);
  }

  private scheduleAutoReset(): void {
    if (this.autoResetTimer) {
      clearTimeout(this.autoResetTimer);
    }
    // Safety fallback: auto-clear loader after 8s to prevent stuck pending state
    this.autoResetTimer = setTimeout(() => {
      if (this.activeRequests > 0) {
        this.reset();
      }
    }, 8000);
  }

  private clearAutoReset(): void {
    if (this.autoResetTimer) {
      clearTimeout(this.autoResetTimer);
      this.autoResetTimer = null;
    }
  }
}
