# Sistem Manajemen Tabungan (Simantab)

Sistem Manajemen Tabungan is a comprehensive dashboard for tracking and managing member savings.

## Architecture

This project originally consisted of a custom Node.js `backend` and a React `frontend`. It has since been migrated to a Clean Architecture serverless model:

- **frontend/**: A React + Vite SPA using Tailwind CSS, Supabase client (`@supabase/supabase-js`), and a centralized service layer (Clean Architecture) for database operations. This is the **Active** codebase.
- **backend/**: A legacy Node.js Express server. **(DEPRECATED)**. Do not map features here.
- **supabase/**: Contains Supabase configuration, schema definitions, and database documentation.

## Running Locally

To run the application locally:

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Set up environment variables in `frontend/.env` using the provided Supabase URL and Anon Key.
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Services Map (Frontend)

- `authService.ts`: Authentication flows for Admin and Member logins
- `adminService.ts`: CRUD operations and data metrics specifically for the Admin Dashboard
- `memberService.ts`: Data management for individual members, handling requests deposits, withdrawals, and updates.
