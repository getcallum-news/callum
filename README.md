# Callum

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**Callum** is an AI-focused news aggregator that filters and delivers only AI-related news to users worldwide. It fetches articles from RSS feeds, Hacker News, and arXiv every 30 minutes, scores them for AI relevance using a keyword-based filter, and sends push notifications to subscribers when new articles arrive. Free for everyone, no account needed.

---

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM (no raw SQL)
- **PostgreSQL** via Supabase — database
- **APScheduler** — background job scheduling
- **feedparser** + **httpx** — RSS and API fetching
- **pywebpush** — Web Push notifications
- **slowapi** — rate limiting
- **bleach** — HTML sanitization
- **Sentry** — error monitoring
- **Alembic** — database migrations

### Frontend
- **Next.js 14** with TypeScript
- **Tailwind CSS** — styling
- **Axios** — API client
- **Firebase Cloud Messaging** — push notification subscriptions

### Infrastructure
- **Supabase** — PostgreSQL hosting (free tier)
- **Render** — backend hosting (free tier)
- **Vercel** — frontend hosting (free tier)
- **Cloudflare** — DNS + DDoS protection (free tier)

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Supabase project (free tier)
- A Firebase project (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/getcallum-news/callum.git
cd callum
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Start dev server
npm run dev
```

The frontend runs at `http://localhost:3000`, the backend at `http://localhost:8000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `SECRET_KEY` | Yes | Random 32+ char string for signing |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for Web Push |
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key for Web Push |
| `VAPID_CLAIMS_EMAIL` | Yes | Email for VAPID claims |
| `FIREBASE_CREDENTIALS_PATH` | Prod | Path to Firebase service account JSON |
| `SENTRY_DSN` | Prod | Sentry project DSN |
| `IS_PRODUCTION` | No | `true` or `false` (default: `false`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (e.g., `http://localhost:8000`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `NEXT_PUBLIC_VAPID_KEY` | Yes | VAPID public key (same as backend) |

---

## Setting Up Supabase PostgreSQL

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once the project is ready, go to **Settings → Database**
3. Copy the **Connection string (URI)** — it looks like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Paste it as `DATABASE_URL` in your backend `.env`
5. Run `alembic upgrade head` to create the tables

---

## Setting Up Firebase + FCM

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Cloud Messaging** in project settings
3. Go to **Project Settings → General** and copy:
   - API Key → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Auth Domain → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - Project ID → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - Messaging Sender ID → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - App ID → `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Go to **Project Settings → Service Accounts** and generate a private key JSON
5. Save the JSON file and set `FIREBASE_CREDENTIALS_PATH` in the backend `.env`

---

## Generating VAPID Keys

VAPID keys are required for Web Push notifications.

```bash
cd backend
source venv/bin/activate

python -c "
from py_vapid import Vapid
vapid = Vapid()
vapid.generate_keys()
print('Private key:', vapid.private_pem())
print('Public key:', vapid.public_key)
"
```

Alternatively, use an online VAPID key generator. Set the keys in both the backend `.env` (`VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`) and frontend `.env.local` (`NEXT_PUBLIC_VAPID_KEY` = the public key).

---

## Deploying on Render (Backend)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set the following:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `.env` in the Render dashboard
5. Set `IS_PRODUCTION=true`
6. Deploy

---

## Deploying on Vercel (Frontend)

1. Import the project on [vercel.com](https://vercel.com)
2. Set the **Root Directory** to `frontend`
3. Framework Preset: **Next.js** (auto-detected)
4. Add all environment variables from `.env.local` in the Vercel dashboard
5. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
6. Deploy

---

## Setting Up Cloudflare

1. Add your domain to [Cloudflare](https://cloudflare.com) (free plan)
2. Update your domain's nameservers to Cloudflare's
3. Add DNS records:
   - `A` or `CNAME` for your frontend → Vercel
   - `A` or `CNAME` for `api.` subdomain → Render
4. Enable **Proxied** (orange cloud) for DDoS protection
5. Under **SSL/TLS**, set to **Full (strict)**
6. Under **Caching**, set browser cache TTL as desired

---

## Database Migrations

Callum uses Alembic for database migrations.

```bash
cd backend
source venv/bin/activate

# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing models
alembic revision --autogenerate -m "description of changes"

# Check current migration status
alembic current

# Roll back one migration
alembic downgrade -1
```

---

## Project Structure

```
callum/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py             # Environment variable loading
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models.py             # ORM models (Article, PushSubscription)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── scheduler.py          # APScheduler background jobs
│   ├── routes/
│   │   ├── news.py           # GET /news, /news/{id}, /health
│   │   └── notifications.py  # POST /subscribe, /unsubscribe
│   ├── services/
│   │   ├── fetcher.py        # RSS, HN, arXiv article fetchers
│   │   ├── filter.py         # AI relevance keyword filter
│   │   └── notifier.py       # Web Push notification sender
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   ├── lib/                  # API client + Firebase setup
│   └── public/               # Static assets + service worker
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep changes focused and write clear commit messages. If adding a new news source, update the keyword filter if needed.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Notes

- **icon-192.png**: Export the Callum logo as a 192x192 PNG and place it at `frontend/public/icon-192.png` for push notification icons.
- **News sources**: All sources are free public APIs and RSS feeds. No API keys are needed for fetching news.
- **Rate limits**: The API enforces per-IP rate limiting. See `routes/news.py` and `routes/notifications.py` for specific limits.
