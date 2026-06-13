# LearnHub LMS — Frontend

Angular single-page application for the **LearnHub** Learning Management System. It connects to the ASP.NET Core backend API and provides role-based interfaces for admins, instructors, and students.

## Tech Stack

- Angular 21
- TypeScript 5.9
- RxJS
- Angular Router and Reactive Forms
- Chart.js with ng2-charts
- Vitest (unit tests)

## Features

- Login and registration
- Role-based dashboards (Admin, Instructor, Student)
- Course and module management
- Student enrollment management
- Assessment and assessment score management
- Module progress tracking with sequential unlocking
- User management and role assignment (Admin)
- Responsive UI with route guards and JWT authentication

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm 11+
- Backend API running locally or deployed on Railway

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/anisaisa/anisa-lms-frontend.git
cd lms-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the backend API

The frontend expects the API at `https://localhost:7253` during local development.

Start the backend from the `anisa-lms` repository:

```bash
dotnet run
```

Swagger: `https://localhost:7253/swagger`

### 4. Run the frontend

```bash
npm start
```

Or:

```bash
ng serve
```

Open `http://localhost:4200/` in your browser.

API requests to `/api` are proxied to the backend via `proxy.conf.json`.

## Environment Configuration

| File | API URL | Use |
|------|---------|-----|
| `src/environments/environment.ts` | `/api` | Local development (proxied) |
| `src/environments/environment.production.ts` | `https://anisa-lms-production.up.railway.app/api` | Production build |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on port 4200 |
| `npm run build` | Production build to `dist/lms-project/browser` |
| `npm run start:prod` | Serve production build locally |
| `npm test` | Run unit tests with Vitest |
| `npm run start:clean` | Clear Angular cache and start dev server |

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access: courses, modules, enrollments, assessments, scores, users |
| **Instructor** | Manage own courses, modules, enrollments, assessments, and scores |
| **Student** | View courses, follow modules, track progress, view assessments |

New users register as **Student** by default. An Admin can change roles from the Users page.

## Main Routes

| Path | Description |
|------|-------------|
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Role-based dashboard |
| `/courses` | Course list |
| `/courses/:courseId` | Course details and modules |
| `/courses/:courseId/modules/:moduleId` | Module content and progress |
| `/assessments` | Assessment list |
| `/assessment-scores` | Record and manage scores |
| `/enrollments` | Enrollment management |
| `/users` | User list and roles |

## Authentication

1. User logs in through `/login`.
2. JWT token is stored in `localStorage`.
3. `authInterceptor` attaches `Authorization: Bearer {token}` to API requests.
4. `authGuard`, `guestGuard`, and `roleGuard` protect routes on the client.

## Project Structure

```
src/
├── app/
│   ├── core/           # Layout, interceptors, constants
│   ├── guards/         # Auth and role guards
│   ├── models/         # DTOs, enums, interfaces
│   ├── pages/          # Feature pages
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── modules/
│   │   ├── assessments/
│   │   ├── assessment-scores/
│   │   ├── enrollments/
│   │   ├── users/
│   │   ├── login/
│   │   └── register/
│   ├── services/       # API client services
│   └── shared/       # Reusable components and utilities
├── environments/     # API URL configuration
└── styles.css        # Global styles
```

## Building for Production

```bash
npm run build
```

Output folder:

```
dist/lms-project/browser/
```

Serve locally:

```bash
npm run start:prod
```

## Deployment (Railway)

Production URL: `https://anisa-lms-frontend-production.up.railway.app`

Suggested start command:

```bash
npx serve -s dist/lms-project/browser -l $PORT
```

Or:

```bash
npm run start:prod
```

Make sure the production API URL in `environment.production.ts` matches your deployed backend.

## Backend Repository

API repository: `https://github.com/anisaisa/anisa-LMS`

| Environment | API URL |
|-------------|---------|
| Local | `https://localhost:7253/api` (via proxy) |
| Production | `https://anisa-lms-production.up.railway.app/api` |

## Testing

```bash
npm test
```

Unit tests use Vitest and jsdom.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| API requests fail locally | Ensure backend is running on `https://localhost:7253` |
| CORS errors in production | Check backend CORS allows the frontend Railway URL |
| Blank page after deploy | Confirm build output path is `dist/lms-project/browser` |
| Login works but pages are empty | Check JWT token and user role in browser dev tools |

## Author

**Anisa**  
South East European University  
Service Oriented Architecture — 2025/2026

## Additional Resources

- [Angular documentation](https://angular.dev/)
- [Angular CLI reference](https://angular.dev/tools/cli)
