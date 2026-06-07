import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-alert',
  template: `
    @if (message()) {
      <div class="alert" [class.alert--error]="variant() === 'error'">
        <span class="alert__icon" aria-hidden="true">!</span>
        {{ message() }}
      </div>
    }
  `,
  styles: `
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      margin: 0 0 1rem;
      padding: 0.9rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .alert__icon {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 800;
    }

    .alert--error {
      color: #991b1b;
      background: #fef2f2;
      border: 1px solid rgb(248 113 113 / 0.35);
    }

    .alert--error .alert__icon {
      background: rgb(248 113 113 / 0.15);
      color: #dc2626;
    }
  `,
})
export class PageAlertComponent {
  readonly message = input<string | null>(null);
  readonly variant = input<'error'>('error');
}
