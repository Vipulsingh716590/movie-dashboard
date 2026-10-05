import { Component, EventEmitter, Input, Output } from '@angular/core';

/** An accessible on/off switch (role="switch"); the parent owns the state and reacts to (changed). */
@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.scss'
})
export class ToggleSwitchComponent {
  @Input({ required: true }) label = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Output() changed = new EventEmitter<boolean>();

  toggle(): void {
    if (!this.disabled) this.changed.emit(!this.checked);
  }
}
