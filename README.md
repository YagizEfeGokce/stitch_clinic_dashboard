# Stitch Clinic Dashboard

A modern, comprehensive Clinic Relationship Management (CRM) dashboard built for ease of use and performance.

## 🚀 Project Overview

The Stitch Clinic Dashboard is designed to help clinics manage their day-to-day operations, including:

- **Client Management**: detailed client profiles and history.
- **Appointment Scheduling**: Visual calendar and booking wizard.
- **Inventory Tracking**: Manage stock and supplies.
- **Financial Reporting**: Revenue tracking and analytics.
- **Staff Performance**: KPI tracking and role-based access control.

## 🛠 Tech Stack

- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository and install dependencies:

    ```bash
    npm install
    ```

2. Set up Environment Variables:
    Create a `.env` file in the root directory (copy from `.env.example` if available) and add your Supabase credentials:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

3. Start the Development Server:

    ```bash
    npm run dev
    ```

## 🏗 Architecture

- **`src/pages`**: Main application views (Dashboard, Clients, etc.).
- **`src/components`**: Reusable UI components.
- **`src/context`**: Global state (Auth, Theme, Toast).
- **`src/layouts`**: Page layouts (MainLayout).
- **`src/lib`**: Third-party library configurations (Supabase).
- **`src/utils`**: Helper functions and constants.

## 📝 Key Features

- **Role-Based Access Control (RBAC)**: Secure routes for Admin, Owner, Doctor, and Staff.
- **Responsive Design**: Fully optimized for desktop and tablet usage.
- **Real-time Updates**: leveraging Supabase subscriptions (where applicable).
