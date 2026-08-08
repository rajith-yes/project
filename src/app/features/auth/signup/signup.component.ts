import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  hidePassword = true;
  isLoading = false;

  signupForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.signupForm.invalid) return;

    this.isLoading = true;
    const { fullName, username, password } = this.signupForm.value;

    this.authService.checkUsernameExists(username).subscribe({
      next: (exists) => {
        if (exists) {
          this.isLoading = false;
          this.signupForm.get('username')?.setErrors({ usernameTaken: true });
          this.notification.showError('Username is already taken. Please choose another.');
        } else {
          this.authService.signup({ fullName, username, password }).subscribe({
            next: () => {
              this.isLoading = false;
              this.notification.showSuccess('Account created successfully! Please sign in.');
              this.router.navigate(['/login']);
            },
            error: () => {
              this.isLoading = false;
              this.notification.showError('Failed to create account. Please try again.');
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.notification.showError('Server error while validating username.');
      }
    });
  }
}
