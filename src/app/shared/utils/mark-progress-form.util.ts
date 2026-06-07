import { FormBuilder, Validators } from '@angular/forms';

export function buildMarkProgressForm(fb: FormBuilder, isCompleted = false) {
  return fb.nonNullable.group({
    isCompleted: [isCompleted, Validators.required],
  });
}
