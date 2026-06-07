import { FormBuilder, Validators } from '@angular/forms';

import { ModuleDto } from '../../models/module.dto';
import { CreateModuleDto } from '../../models/create-module.dto';
import { UpdateModuleDto } from '../../models/update-module.dto';

export function buildModuleForm(fb: FormBuilder, module?: ModuleDto) {
  return fb.nonNullable.group({
    title: [module?.title ?? '', [Validators.required, Validators.minLength(3)]],
    content: [module?.content ?? '', [Validators.required]],
    orderIndex: [module?.orderIndex ?? 0, [Validators.required, Validators.min(0)]],
  });
}

export function toCreateModuleDto(
  value: ReturnType<typeof buildModuleForm>['value'],
  courseId: number,
): CreateModuleDto {
  return {
    title: value.title!,
    content: value.content!,
    orderIndex: value.orderIndex!,
    courseId,
  };
}

export function toUpdateModuleDto(
  value: ReturnType<typeof buildModuleForm>['value'],
): UpdateModuleDto {
  return {
    title: value.title!,
    content: value.content!,
    orderIndex: value.orderIndex!,
  };
}
