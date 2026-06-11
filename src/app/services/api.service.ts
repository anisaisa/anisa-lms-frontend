import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.toHttpParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post(`${this.baseUrl}${path}`, body, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => this.parseResponseBody<T>(response.body, response.status)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put(`${this.baseUrl}${path}`, body, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => this.parseResponseBody<T>(response.body, response.status)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete(`${this.baseUrl}${path}`, { observe: 'response', responseType: 'text' })
      .pipe(map((response) => this.parseResponseBody<T>(response.body, response.status)));
  }

  private parseResponseBody<T>(body: string | null, status: number): T {
    if (status === 204 || !body?.trim()) {
      return undefined as T;
    }

    return JSON.parse(body) as T;
  }

  private toHttpParams(
    params?: Record<string, string | number | boolean>,
  ): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
