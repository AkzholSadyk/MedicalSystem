import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-avatar-preview',
  template: `
    <div class="preview-container">
      <button mat-icon-button class="close-btn" (click)="close()" aria-label="Close preview">
        <mat-icon>close</mat-icon>
      </button>
      <div class="preview-content">
  <img [src]="data.url" alt="avatar preview" class="preview-image" />
      </div>
    </div>
  `,
  styles: [
    `:host { display:block; width:100%; height:100%; }
     .preview-container { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.9); }
     .preview-content { max-width: 96vw; max-height: 92vh; }
     .preview-image { width:100%; height:100%; object-fit:contain; border-radius:8px; box-shadow: 0 8px 30px rgba(0,0,0,0.6); }
     .close-btn { position:absolute; top:12px; right:12px; color:#fff; background: rgba(0,0,0,0.3); }
    `
  ],
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
})
export class AvatarPreviewComponent {
  constructor(
    private dialogRef: MatDialogRef<AvatarPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { url: string }
  ) {}

  close() { this.dialogRef.close(); }
}
