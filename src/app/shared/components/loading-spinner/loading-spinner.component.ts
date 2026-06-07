import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-wrap" [class.spinner-wrap--inline]="inline()">
      <span class="spinner" aria-hidden="true"></span>
      @if (label()) {
        <span class="spinner__label">{{ label() }}</span>
      }
    </div>
  `,
  styles: `
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2.5rem 1rem;
    }

    .spinner-wrap--inline {
      flex-direction: row;
      padding: 0.5rem 0;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid rgb(124 58 237 / 0.15);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .spinner__label {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class LoadingSpinnerComponent {
  readonly label = input('Loading...');
  readonly inline = input(false);
}
