import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open()) {
      <div class="dialog-backdrop" role="presentation" (click)="cancelled.emit()"></div>
      <div
        class="dialog"
        role="alertdialog"
        [attr.aria-labelledby]="'dialog-title'"
        [attr.aria-describedby]="'dialog-desc'"
      >
        <h2 id="dialog-title" class="dialog__title">{{ title() }}</h2>
        <p id="dialog-desc" class="dialog__message">{{ message() }}</p>
        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" (click)="cancelled.emit()">
            {{ cancelLabel() }}
          </button>
          <button type="button" class="btn btn--danger" (click)="confirmed.emit()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgb(30 27 46 / 0.45);
      backdrop-filter: blur(6px);
    }

    .dialog {
      position: fixed;
      z-index: 51;
      top: 50%;
      left: 50%;
      width: min(92vw, 24rem);
      padding: 1.5rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-xl);
      background: #fff;
      box-shadow: var(--shadow-md), var(--shadow-glow);
      transform: translate(-50%, -50%);
      overflow: hidden;
    }

    .dialog::before {
      content: '';
      position: absolute;
      top: 0;
      left: 1.25rem;
      right: 1.25rem;
      height: 3px;
      border-radius: 0 0 4px 4px;
      background: linear-gradient(90deg, var(--purple-400), var(--purple-700));
      opacity: 0.75;
    }

    .dialog__title {
      margin: 0 0 0.5rem;
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .dialog__message {
      margin: 0 0 1.25rem;
      color: var(--text-muted);
      font-size: 0.925rem;
      line-height: 1.5;
    }

    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.65rem;
    }

    .btn {
      padding: 0.55rem 0.95rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .btn--ghost {
      background: transparent;
      border-color: var(--border);
      color: var(--text-muted);
    }

    .btn--ghost:hover {
      background: var(--purple-50);
      color: var(--text);
    }

    .btn--danger {
      background: #dc2626;
      color: #fff;
    }

    .btn--danger:hover {
      filter: brightness(1.05);
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirm');
  readonly message = input('Are you sure?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
