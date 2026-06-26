# Financial MIS Dashboard

A production-grade Financial Business Intelligence Dashboard built with React 19, Vite, TailwindCSS, Firebase, and Recharts.

## Features

- **CFO Dashboard** — KPI cards, trend charts, revenue composition, expense breakdown
- **Monthly Data Entry** — Validated form with edit, delete, duplicate support
- **Analytics** — Deep-dive trend analysis with summary tables
- **Reports** — Monthly, Quarterly, Half-Year, Annual with CSV export
- **Charts** — Full chart library with 7 chart types
- **Timeline** — Complete company financial history
- **Audit Log** — Every change tracked with user and timestamp
- **User Management** — Admin, Manager, Accountant, Viewer roles
- **Settings** — Theme, company settings, profile, password
- **Dark Mode** — Full light/dark theme support
- **Responsive** — Works on desktop, tablet, mobile

## Tech Stack

- React 19 + TypeScript
- Vite 5
- TailwindCSS + shadcn/ui components
- Firebase (Auth + Firestore)
- Recharts
- Framer Motion
- Zustand
- React Hook Form + Zod

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Create **Firestore Database** (start in test mode)
5. Get your Firebase config from Project Settings

### 2. Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Create First Admin User

In Firebase Console → Authentication → Add user manually, then in Firestore create:

**Collection:** `users`  
**Document ID:** `{uid from auth}`

```json
{
  "email": "admin@company.com",
  "displayName": "Admin User",
  "role": "admin"
}
```

### 4. Run the App

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 5. Production Build

```bash
npm run build
npm run preview
```

## Firestore Data Structure

### financials/{year}-{month-abbr}
```json
{
  "year": 2026,
  "month": "April",
  "revenue": 2366450,
  "sales": {
    "export": 1802250,
    "b2b": 540000,
    "retail": 24200,
    "bulk": 0
  },
  "expenses": {
    "cogs": 1518426,
    "employee": 1061196,
    "finance": 114087,
    "depreciation": 1525796,
    "other": 938527
  },
  "collections": 2008230,
  "receivables": 0,
  "payables": 0,
  "notes": "",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "uid"
}
```

## User Roles

| Role | Dashboard | Reports | Entry | Delete | Admin |
|------|-----------|---------|-------|--------|-------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✗ | ✗ |
| Accountant | ✓ | ✗ | ✓ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ | ✗ |

## Calculated Metrics (Never Stored)

All these are computed on the fly:
- Gross Margin = Revenue − COGS
- Gross Margin % = Gross Margin / Revenue × 100
- Operating Expenses = Employee + Finance + Depreciation + Other
- Total Expenses = COGS + Operating Expenses
- Operating Profit = Gross Margin − Operating Expenses
- Net Margin = Operating Profit
- Net Margin % = Net Margin / Revenue × 100
- Collection % = Collections / Revenue × 100
- COGS % = COGS / Revenue × 100
- Monthly Growth % = (Current − Previous) / Previous × 100
