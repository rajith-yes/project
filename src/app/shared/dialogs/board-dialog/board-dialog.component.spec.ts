import { ComponentFixture, TestBed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BoardDialogComponent } from './board-dialog.component';

describe('BoardDialogComponent', () => {
  let component: BoardDialogComponent;
  let fixture: ComponentFixture<BoardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Create Board' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
