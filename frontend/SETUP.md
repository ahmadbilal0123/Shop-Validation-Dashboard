# Setup Guide - Shop Validation Dashboard

## 📁 Correct Folder Structure

After downloading, your project should look like this:

\`\`\`
shop-validation-dashboard/
├── frontend/                    # ← All files should be inside here
│   ├── app/                    # Next.js pages
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # React components
│   │   ├── ui/
│   │   ├── auth-provider.tsx
│   │   └── ...
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   ├── scripts/                # Setup scripts
│   ├── package.json           # Dependencies
│   ├── .env.local             # Environment variables
│   ├── tailwind.config.js     # Tailwind config
│   ├── next.config.mjs        # Next.js config
│   ├── tsconfig.json          # TypeScript config
│   └── README.md              # Frontend README
└── README.md                   # Main README
\`\`\`

## 🚨 Common Issue: Files Outside Frontend Folder

If after downloading you see this structure:
\`\`\`
shop-validation-dashboard/
├── app/                       # ❌ Wrong location
├── components/                # ❌ Wrong location  
├── hooks/                     # ❌ Wrong location
├── lib/                       # ❌ Wrong location
├── package.json               # ❌ Wrong location
├── frontend/                  # ❌ Empty or missing
└── README.md
\`\`\`

**Fix it by moving all files into the frontend folder:**

### Option 1: Manual Move
1. Create `frontend/` folder if it doesn't exist
2. Move `app/`, `components/`, `hooks/`, `lib/`, `package.json`, and all config files into `frontend/`
3. Keep only `README.md` in the root

### Option 2: Command Line (Linux/Mac)
\`\`\`bash
mkdir -p frontend
mv app components hooks lib package.json *.config.* *.json .env* frontend/
\`\`\`

### Option 3: Command Line (Windows)
\`\`\`cmd
mkdir frontend
move app frontend\
move components frontend\
move hooks frontend\
move lib frontend\
move package.json frontend\
move *.config.* frontend\
move *.json frontend\
\`\`\`

## ✅ Verify Setup

1. **Navigate to frontend directory:**
   \`\`\`bash
   cd frontend
   \`\`\`

2. **Run verification script:**
   \`\`\`bash
   npm run verify
   \`\`\`

3. **If verification passes, install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

4. **Configure environment variables:**
   Create or edit `.env.local`:
   \`\`\`bash
   NEXT_PUBLIC_API_BASE_URL=https://your-mongodb-backend.com
   \`\`\`

5. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open in browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🔧 Troubleshooting

### "package.json not found"
- Make sure you're in the `frontend` directory
- Run `pwd` (Linux/Mac) or `cd` (Windows) to check current directory
- Should show: `.../shop-validation-dashboard/frontend`

### "Module not found" errors
- Run `npm install` in the `frontend` directory
- Make sure all files are in the correct locations

### "API base URL not configured"
- Create `.env.local` file in the `frontend` directory
- Add your MongoDB backend URL

### Login page not showing
- Check browser console (F12) for errors
- Verify all component files are in `frontend/components/`
- Try visiting `/test` page first to verify routing

## 📞 Need Help?

If you're still having issues:

1. **Check file locations** - Run `npm run verify` in the frontend directory
2. **Check browser console** - Press F12 and look for errors
3. **Check terminal output** - Look for error messages when running `npm run dev`
4. **Verify environment** - Make sure Node.js 18+ is installed

## 🎯 Quick Test

After setup, test these URLs:
- `http://localhost:3000/` - Should redirect to login
- `http://localhost:3000/login` - Should show login form
- `http://localhost:3000/test` - Should show test page
\`\`\`

```typescriptreact file="frontend/README.md"
[v0-no-op-code-block-prefix]# Shop Validation Dashboard - Frontend

## 🚨 IMPORTANT: Setup Instructions

**Before starting, ensure all files are in the correct location!**

👉 **[Read SETUP.md for detailed instructions](./SETUP.md)**

### Quick Check:
1. Are you in the `frontend` directory? 
2. Run: `npm run verify` to check your setup
3. If verification fails, see SETUP.md for fixes

---

Next.js frontend application for the Shop Validation Dashboard.

## Setup

### 1. Verify File Structure
\`\`\`bash
npm run verify
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment
Edit `.env.local`:
\`\`\`bash
NEXT_PUBLIC_API_BASE_URL=https://your-mongodb-backend.com
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run verify` - Verify file structure

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - MongoDB backend base URL

## Project Structure

\`\`\`plaintext
frontend/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   │   ├── users/        # User management
│   │   ├── visits/       # Shop visits monitoring
│   │   ├── layout.tsx    # Dashboard layout
│   │   └── page.tsx      # Dashboard home
│   ├── login/            # Authentication
│   │   └── page.tsx      # Login page
│   ├── setup/            # Configuration
│   │   └── page.tsx      # Setup guide
│   ├── test-api/         # API testing
│   │   └── page.tsx      # API test page
│   ├── debug/            # Debug tools
│   │   └── page.tsx      # Debug information
│   ├── config/           # Configuration
│   │   └── page.tsx      # API configuration
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   │   └── avatar.tsx   # Avatar component
│   ├── auth-provider.tsx      # Authentication context
│   ├── dashboard-sidebar.tsx  # Dashboard navigation
│   ├── login-error-handler.tsx # Login error handling
│   ├── api-config.tsx         # API configuration
│   ├── api-test.tsx           # API testing
│   ├── env-setup.tsx          # Environment setup
│   └── login-debug.tsx        # Login debugging
├── hooks/               # Custom hooks
│   └── use-auth.ts     # Authentication hook
├── lib/                # Utilities
│   ├── auth.ts         # Authentication logic
│   └── utils.ts        # Utility functions
├── .env.local          # Environment variables
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── tailwind.config.js  # Tailwind config
├── next.config.mjs     # Next.js config
├── postcss.config.js   # PostCSS config
├── .eslintrc.json      # ESLint config
├── .gitignore          # Git ignore
├── next-env.d.ts       # TypeScript declarations
└── README.md           # This file
\`\`\`

## Features

- **Role-based authentication** with MongoDB backend
- **Real-time dashboard** with analytics
- **Shop visits monitoring** with GPS verification
- **AI analysis display** for validation results
- **GPS matching** with location verification
- **User management** with hierarchical access
- **Responsive design** for all devices

## API Integration

Connects to MongoDB backend via:
- `./api/users/login` - User authentication

## Development Pages

Visit these pages for development and configuration:
- `/setup` - Configuration guide and status
- `/test-api` - Test API connection with real credentials
- `/debug` - Debug information and API details
- `/config` - API configuration interface

## Authentication Flow

1. User enters credentials on `/login`
2. Frontend calls `./api/users/login` endpoint
3. Backend validates against MongoDB
4. Session created in localStorage
5. User redirected to `/dashboard`

## Role-Based Access

- **Admin** - Full access to all features
- **Manager** - User management + reports
- **Supervisor** - Reports + analysis
- **Regional** - Basic reports only

## Deployment

### Build for Production
\`\`\`bash
npm run build
\`\`\`

### Start Production Server
\`\`\`bash
npm run start
\`\`\`

## Environment Setup

Required environment variables in `.env.local`:
\`\`\`bash
NEXT_PUBLIC_API_BASE_URL=https://your-mongodb-backend.com
\`\`\`

Replace with your actual MongoDB backend URL.
