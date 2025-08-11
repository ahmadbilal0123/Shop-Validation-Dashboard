# Shop Validation Dashboard

A comprehensive shop validation and monitoring system with role-based access control.

## Project Structure

\`\`\`
shop-validation-dashboard/
├── frontend/                 # Next.js Frontend Application
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── users/      # User management
│   │   │   ├── visits/     # Shop visits
│   │   │   ├── layout.tsx  # Dashboard layout
│   │   │   └── page.tsx    # Dashboard home
│   │   ├── login/          # Authentication pages
│   │   ├── setup/          # Configuration pages
│   │   ├── test-api/       # API testing
│   │   ├── debug/          # Debug tools
│   │   ├── config/         # Configuration
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── auth-provider.tsx
│   │   ├── dashboard-sidebar.tsx
│   │   ├── login-error-handler.tsx
│   │   ├── api-config.tsx
│   │   ├── api-test.tsx
│   │   ├── env-setup.tsx
│   │   └── login-debug.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── use-auth.ts
│   ├── lib/               # Utility functions and configurations
│   │   ├── auth.ts        # Authentication logic
│   │   └── utils.ts       # Utility functions (HTTP/HTTPS fix)
│   ├── .env.local         # Environment variables
│   ├── package.json       # Frontend dependencies
│   ├── tsconfig.json      # TypeScript configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── next.config.mjs    # Next.js configuration
│   ├── postcss.config.js  # PostCSS configuration
│   ├── .eslintrc.json     # ESLint configuration
│   ├── .gitignore         # Git ignore rules
│   ├── next-env.d.ts      # Next.js TypeScript declarations
│   └── README.md          # Frontend-specific README
└── README.md              # This file
\`\`\`

## Quick Start

### 1. Download and Extract
After downloading, ensure your project structure looks like this:
\`\`\`
shop-validation-dashboard/
├── frontend/                 # All frontend files should be here
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   ├── package.json        # Dependencies
│   └── ...                 # Other config files
└── README.md               # This file
\`\`\`

**Important**: If files are extracted outside the `frontend` folder, move them into the `frontend` directory before proceeding.

### 2. Navigate to Frontend Directory
\`\`\`bash
cd frontend
\`\`\`

### 3. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 4. Configure Environment Variables
Create `frontend/.env.local`:
\`\`\`bash
NEXT_PUBLIC_API_BASE_URL=https://your-mongodb-backend.com
\`\`\`

### 5. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### 6. Open Application
Visit [http://localhost:3000](http://localhost:3000)

## Features

- **🔐 Role-based Authentication** - Admin, Manager, Supervisor, Regional roles
- **📊 Shop Visits Monitoring** - Real-time shop validation tracking  
- **🤖 AI Analysis Results** - AI-powered analysis display
- **📍 GPS Matching** - Location verification system
- **👥 User Management** - Hierarchical user access control
- **📱 Responsive Design** - Works on desktop and mobile

## Backend Requirements

Your MongoDB backend should provide:

**POST** `./api/users/login`
- Authentication endpoint for user login
- Returns user data with role and permissions

## Development

### Frontend Development
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Configuration
- Visit `/setup` for configuration guide
- Visit `/test-api` to test backend connection
- Visit `/debug` for debugging information

## Environment Variables

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_BASE_URL` - Your MongoDB backend base URL

## Pages

- `/login` - User authentication
- `/dashboard` - Main dashboard with analytics
- `/dashboard/visits` - Shop visits monitoring
- `/dashboard/users` - User management (admin/manager only)
- `/setup` - Environment configuration guide
- `/test-api` - API connection testing
- `/config` - API configuration
- `/debug` - Debug information

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

## File Organization

### App Directory (`frontend/app/`)
- **Pages** - Each folder represents a route
- **Layouts** - Shared layouts for route groups
- **Loading** - Loading UI components
- **Global CSS** - Application-wide styles

### Components Directory (`frontend/components/`)
- **UI Components** - Reusable interface elements
- **Feature Components** - Business logic components
- **Provider Components** - Context providers

### Lib Directory (`frontend/lib/`)
- **Authentication** - Login/logout logic
- **Utilities** - Helper functions and API utilities

### Hooks Directory (`frontend/hooks/`)
- **Custom Hooks** - Reusable React hooks

## License

Private project for shop validation system.
