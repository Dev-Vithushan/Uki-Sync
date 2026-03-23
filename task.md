# Jira-Like Student Task Manager — Build Checklist

## Phase 1: Planning
- [/] Create implementation plan with A-Z architecture
- [ ] Get user approval on the plan

## Phase 2: Project Setup
- [ ] Initialize Vite + React project in `/Users/vithushan/Documents/UkiSync`
- [ ] Install dependencies (mongoose, jsonwebtoken, bcryptjs, etc.)
- [ ] Configure Vercel serverless API structure (`/api/` directory)
- [ ] Set up MongoDB Atlas connection utility

## Phase 3: Backend (Vercel Serverless Functions)
- [ ] Auth endpoints (register, login, me)
- [ ] User management endpoints (CRUD)
- [ ] Ticket endpoints (CRUD, status transitions, comments)
- [ ] Auth middleware (JWT verification)

## Phase 4: Frontend (React)
- [ ] Design system — CSS variables, fonts, global styles
- [ ] Auth context & protected routes
- [ ] Login page
- [ ] Dashboard page (stats, recent tickets)
- [ ] Board view (Kanban-style columns)
- [ ] Ticket detail modal/page
- [ ] User management page (Admin)
- [ ] Layout — Sidebar + Topbar

## Phase 5: Integration & Polish
- [ ] Connect frontend to serverless API
- [ ] Add loading states, error handling, toasts
- [ ] Responsive design

## Phase 6: Deployment
- [ ] Set up MongoDB Atlas cluster & get connection string
- [ ] Configure Vercel environment variables
- [ ] Deploy to Vercel via CLI or GitHub
- [ ] Verify deployed app

## Phase 7: Verification
- [ ] Browser-based testing of auth flow
- [ ] Ticket CRUD and status transitions
- [ ] Role-based access control
- [ ] User to do manual deployment verification
