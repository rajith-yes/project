import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Board } from '../../../../app/core/models/board.model';

export interface BoardDialogData {
  title: string;
  name?: string;
  existingBoards?: Board[];
  submitText?: string;
}

export function uniqueBoardNameValidator(existingBoards: Board[] = [], currentName?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const inputName = control.value.trim().toLowerCase();
    if (!inputName) return null;

    if (currentName && inputName === currentName.trim().toLowerCase()) {
      return null;
    }

    const isTaken = existingBoards.some(
      b => b.name && b.name.trim().toLowerCase() === inputName
    );

    return isTaken ? { nameTaken: true } : null;
  };
}

@Component({
  selector: 'app-board-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './board-dialog.component.html',
  styleUrl: './board-dialog.component.scss'
})
export class BoardDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BoardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BoardDialogData
  ) {
    const existingBoards = data.existingBoards || [];
    const currentName = data.name || '';

    this.form = this.fb.group({
      name: [
        currentName,
        [
          Validators.required,
          Validators.minLength(2),
          uniqueBoardNameValidator(existingBoards, currentName)
        ]
      ]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.name.trim());
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
