# UkiSync Deployment (Vercel + MongoDB Atlas)

## 1. MongoDB Atlas Setup
1. Create a MongoDB Atlas project and an M0 free cluster.
2. Create a database user (username + strong password).
3. In Atlas `Network Access`, allow your app to connect.
   - For Vercel Hobby/serverless, easiest is `0.0.0.0/0` (open IP allowlist).
   - Use strong DB credentials if you use open IP allowlist.
4. Copy the `mongodb+srv` connection string.
5. Replace placeholders and set DB name to `ukisync`, example:
   - `mongodb+srv://<db_user>:<db_password>@<cluster-host>/ukisync?retryWrites=true&w=majority`

## 2. Required Environment Variables
Set these in Vercel Project Settings -> Environment Variables:
- `MONGODB_URI` = your Atlas URI
- `JWT_SECRET` = long random secret
- `VITE_API_BASE` = `/api`

Security note:
- If your Atlas URI/password is shared in chat/screenshots, rotate the DB user password immediately in Atlas and update `MONGODB_URI` everywhere.

Optional local `.env.local` for testing:
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `VITE_API_BASE=/api`

## 3. Deploy to Vercel
From project root (`/Users/vithushan/Documents/UkiSync`):

```bash
# login once
npx vercel login

# first link/setup
npx vercel

# production deploy
npx vercel --prod
```

If you prefer CLI env commands:

```bash
npx vercel env add MONGODB_URI production
npx vercel env add JWT_SECRET production
npx vercel env add VITE_API_BASE production
```

## 4. Bootstrap First Admin (Important)
After first deploy, immediately create the first admin account:

```bash
curl -X POST https://<your-domain>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"StrongPassword123!"}'
```

Then login from `/login` and create users/boards/tickets.

## 5. Verify Deployment
1. Open `https://<your-domain>/login`
2. Login with your admin account.
3. Create a board and check board ID generation (example: `WSD`).
4. Create tickets and verify key sequence (`WSD-01`, `WSD-02`, ...).
