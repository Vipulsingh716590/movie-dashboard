import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/** An in-page confirmation (browsers' own confirm() is blocked in some hosts, and it can't be styled or tested). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() confirmLabel = 'Confirm';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }
}
