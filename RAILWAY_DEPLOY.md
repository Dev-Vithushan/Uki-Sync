# UkiSync Deployment on Railway (Two Services)

This repository should be deployed as **two Railway services**:

1. `ukisync-api` (backend Node API)
2. `ukisync-web` (frontend React app)

Do not deploy this as a single static site if you want login/boards/tickets to work.

## Service 1: Backend (`ukisync-api`)

Create a Railway **Web Service** from this same GitHub repository.

- Build Command: `npm install`
- Start Command: `npm run start:api`

Required environment variables:

- `MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.qfvydqw.mongodb.net/ukisync?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET=<long-random-secret>`
- `CORS_ORIGIN=https://<your-frontend-domain>.up.railway.app`

After deployment, test:

- `https://<api-domain>.up.railway.app/api/health`

Expected response:

```json
{"status":"ok"}
```

## Service 2: Frontend (`ukisync-web`)

Create another Railway **Web Service** from the same repository.

- Build Command: `npm run build:frontend`
- Start Command: `npm run start:frontend`

Required environment variables:

- `VITE_API_BASE=https://<api-domain>.up.railway.app/api`

Open frontend:

- `https://<frontend-domain>.up.railway.app/login`

## Bootstrap First Admin (if DB is empty)

```bash
curl -X POST https://<api-domain>.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@ukisync.com","password":"Admin@123"}'
```

## Common Failure

If `/api/*` returns HTML instead of JSON, you are hitting the frontend service, not backend.
Use the backend domain for API requests via `VITE_API_BASE`.
