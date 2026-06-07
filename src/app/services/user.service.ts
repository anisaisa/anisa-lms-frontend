import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AssignRoleDto } from '../models/assign-role.dto';
import { LoginDto } from '../models/login.dto';
import { RegisterDto } from '../models/register.dto';
import { RegisterResponse } from '../models/register-response.model';
import { User } from '../models/user.model';
import { UserDto, UserListItem } from '../models/user.dto';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  login(dto: LoginDto): Observable<UserDto> {
    return this.api.post<UserDto>('/user/login', dto);
  }

  register(dto: RegisterDto): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/user/register', dto);
  }

  logout(): Observable<void> {
    return this.api.post<void>('/user/logout', {});
  }

  assignRole(dto: AssignRoleDto): Observable<void> {
    return this.api.post<void>('/user/assign-role', dto);
  }

  getUsers(): Observable<User[]> {
    return this.api
      .get<unknown[]>('/user/users')
      .pipe(map((items) => items.map((item) => this.mapUser(item))));
  }

  getStudents(): Observable<User[]> {
    return this.api
      .get<unknown[]>('/user/students')
      .pipe(map((items) => items.map((item) => this.mapUser(item))));
  }

  mapUser(raw: unknown): User {
    const record = raw as Record<string, unknown>;
    return {
      id: String(record['id'] ?? record['Id'] ?? ''),
      fullName: String(record['fullName'] ?? record['FullName'] ?? ''),
      email: String(record['email'] ?? record['Email'] ?? ''),
      role: String(record['role'] ?? record['Role'] ?? ''),
    };
  }

  /** @deprecated Use {@link mapUser} */
  mapUserListItem(raw: unknown): User {
    return this.mapUser(raw);
  }
}
