import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [AsyncPipe],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts$ = this.toastService.toasts$;

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
