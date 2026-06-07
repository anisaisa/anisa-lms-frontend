import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AssessmentScoreDto } from '../models/assessment-score.dto';
import { CreateAssessmentScoreDto } from '../models/create-assessment-score.dto';
import { UpdateAssessmentScoreDto } from '../models/update-assessment-score.dto';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AssessmentScoreService {
  private readonly api = inject(ApiService);

  createAssessmentScore(dto: CreateAssessmentScoreDto): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/assessment-score', dto);
  }

  updateAssessmentScore(scoreId: number, dto: UpdateAssessmentScoreDto): Observable<void> {
    return this.api.put<void>(`/assessment-score/${scoreId}`, dto);
  }

  deleteAssessmentScore(scoreId: number): Observable<void> {
    return this.api.delete<void>(`/assessment-score/${scoreId}`);
  }

  mapScore(raw: unknown): AssessmentScoreDto {
    const record = raw as Record<string, unknown>;
    return {
      id: Number(record['id'] ?? record['Id']),
      score: Number(record['score'] ?? record['Score'] ?? 0),
      studentFullName: String(record['studentFullName'] ?? record['StudentFullName'] ?? ''),
    };
  }
}
