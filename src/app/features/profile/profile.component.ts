import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  currentUser: User | null = null;
  isLoading = false;

  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    username: [{ value: '', disabled: false }]
  });

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.profileForm.patchValue({
        fullName: this.currentUser.fullName,
        username: this.currentUser.username
      });
      this.profileForm.get('username')?.disable();
      this.profileForm.markAsPristine();
    }
  }

  get isFormChanged(): boolean {
    if (!this.currentUser) return false;
    const currentFullName = this.profileForm.get('fullName')?.value?.trim() || '';
    return currentFullName !== (this.currentUser.fullName || '').trim();
  }

  getInitial(): string {
    if (this.currentUser && this.currentUser.fullName) {
      return this.currentUser.fullName.charAt(0).toUpperCase();
    }
    return 'U';
  }

  onSave(): void {
    if (this.profileForm.invalid || !this.currentUser || !this.isFormChanged) return;

    this.isLoading = true;
    const newFullName = this.profileForm.get('fullName')?.value.trim();

    this.authService.updateProfile(this.currentUser.id, newFullName).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.currentUser = updatedUser;
        this.profileForm.markAsPristine();
        this.notification.showSuccess('Profile updated successfully!');
      },
      error: () => {
        this.isLoading = false;
        this.notification.showError('Failed to update profile. Please try again.');
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.notification.showInfo('You have signed out.');
    this.router.navigate(['/login']);
  }
}
