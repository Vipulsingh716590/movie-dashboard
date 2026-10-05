import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Skeleton while loading and a retry panel when the API can't be reached. */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss'
})
export class LoadingStateComponent {
  @Input() failed = false;
  @Output() retry = new EventEmitter<void>();
}
