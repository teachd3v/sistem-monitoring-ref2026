# Sistem Monitoring - Ramadan EduAction Festival 2026

A full-stack web application designed for monitoring the achievements of fundraising (penghimpunan), events, and partnerships (kemitraan) during the Ramadan EduAction Festival 2026. Data is managed securely with Supabase integration.

## 🚀 Tech Stack

- **Frontend & Backend**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Storage**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 📋 Features

1. **Transaction Validation & Management**: Review and categorize financial donations and mutasi banks from CSVs.
2. **Event & Kemitraan Records**: Store and manage event details along with compressed image uploads.
3. **Optimized Client-Side Compression**: Automatically compresses high-resolution photos to ~1MB before uploading to Supabase Storage.
4. **Dashboard Analytics**: Real-time progress monitoring based on predefined funding targets.

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Supabase Project (Database & Storage buckets)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd sistem-rekening/frontend
npm install
```

### 2. Configure Environment Variables

Create `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deployment to Vercel

1. **Push to GitHub**: Commit your changes and push to a new GitHub repository.
2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and click "Add New Project"
   - Import your GitHub repository
   - **Important**: Set Root Directory to `frontend`
   - Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Click "Deploy"

## 📝 License

MIT
