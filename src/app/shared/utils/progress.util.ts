import { ModuleDto } from '../../models/module.dto';
import { StudentModuleProgressDto } from '../../models/student-module-progress.dto';

export interface CourseProgressStats {
  totalModules: number;
  completedModules: number;
  remainingModules: number;
  progressPercent: number;
  isCourseCompleted: boolean;
}

export function computeCourseProgressStats(
  modules: ModuleDto[],
  progressList: StudentModuleProgressDto[],
): CourseProgressStats {
  const totalModules = modules.length;
  const completedByModule = new Map(
    progressList.map((entry) => [entry.moduleId, entry.isCompleted]),
  );
  const completedModules = modules.filter(
    (module) => completedByModule.get(module.id) === true,
  ).length;
  const remainingModules = Math.max(totalModules - completedModules, 0);
  const progressPercent =
    totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

  return {
    totalModules,
    completedModules,
    remainingModules,
    progressPercent,
    isCourseCompleted: totalModules > 0 && completedModules === totalModules,
  };
}

export function getProgressForModule(
  progressList: StudentModuleProgressDto[],
  moduleId: number,
): StudentModuleProgressDto | undefined {
  return progressList.find((entry) => entry.moduleId === moduleId);
}

export function isModuleCompleted(
  progressList: StudentModuleProgressDto[],
  moduleId: number,
): boolean {
  return getProgressForModule(progressList, moduleId)?.isCompleted ?? false;
}

/** Admin/Instructor: all modules unlocked for review (no student progress). */
export function unlockAllModulesForStaff(modules: ModuleDto[]): ModuleDto[] {
  return modules.map((module) => ({ ...module, isLocked: false }));
}

/** Recompute lock flags from progress (API cache may return stale isLocked). */
export function applyModuleLockState(
  modules: ModuleDto[],
  progressList: StudentModuleProgressDto[],
): ModuleDto[] {
  if (!modules.length) {
    return modules;
  }

  const completionByModule = new Map(
    progressList.map((entry) => [entry.moduleId, entry.isCompleted === true]),
  );
  const lockByModuleId = new Map<number, boolean>();
  let previousCompleted = true;

  for (const module of [...modules].sort((a, b) => a.orderIndex - b.orderIndex)) {
    lockByModuleId.set(module.id, !previousCompleted);
    previousCompleted = completionByModule.get(module.id) === true;
  }

  return modules.map((module) => ({
    ...module,
    isLocked: lockByModuleId.get(module.id) ?? module.isLocked,
  }));
}

export function formatCompletionDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
