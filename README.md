# AquaFlow Smart Grid

A modern smart water management platform built with React, TypeScript, TanStack Router, Supabase, and Leaflet Maps.

---

# 📌 Project Overview

AquaFlow Smart Grid is a web-based platform designed to manage and monitor water distribution systems efficiently. The application provides dashboards, mapping systems, tracking, municipal monitoring, driver management, and user portals.

The platform helps:

* Monitor water supply routes
* Visualize locations using maps
* Track delivery vehicles
* Manage municipal operations
* Provide a user-friendly dashboard for citizens and administrators

---

# 🚀 Technologies Used

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* TanStack Router
* TanStack React Query
* ShadCN UI
* Radix UI
* Recharts
* React Hook Form

## Maps & Tracking

* Leaflet
* React Leaflet
* Leaflet Routing Machine
* Leaflet Heatmaps

## Backend & Database

* Supabase
* PostgreSQL (via Supabase)

## Deployment & Hosting

* Cloudflare
* Vite Build System

---

# 📂 Project Structure

```bash
AquaFlow-Smart-Grid/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── portals/
│   ├── routes/
│   ├── styles.css
│   ├── router.tsx
│   └── start.ts
│
├── supabase/
│   └── config.toml
│
├── .env
├── package.json
├── vite.config.ts
├── tsconfig.json
└── wrangler.jsonc
```

---

# ✨ Features

## 🌍 Interactive Maps

* Live map integration using Leaflet
* Route visualization
* Heatmap display
* Water tracking system

## 👨‍💼 Municipal Portal

* Municipal dashboard
* Water distribution monitoring
* Route management
* Analytics support

## 🚚 Driver Portal

* Driver route tracking
* Vehicle movement tracking
* Delivery updates

## 👤 User Portal

* Water status tracking
* Dashboard access
* Notifications and updates

## 📊 Dashboard & Analytics

* Charts using Recharts
* Real-time updates
* System monitoring

---

# 🗄️ Database Information

The project uses **Supabase** as the backend service.

Supabase internally uses:

* PostgreSQL Database
* Authentication System
* REST APIs
* Realtime Services
* File Storage

---

# 🔑 Environment Variables

Create a `.env` file in the project root.

Example:

```env
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

# 🛢️ Database Configuration

## Supabase Project Details

```env
Project ID: qucrmpwbpdlncwmtdxkh
Database: PostgreSQL
```

## Example Database Tables

### users

| Column     | Type      |
| ---------- | --------- |
| id         | uuid      |
| name       | text      |
| email      | text      |
| role       | text      |
| created_at | timestamp |

### water_routes

| Column         | Type      |
| -------------- | --------- |
| id             | uuid      |
| route_name     | text      |
| start_location | text      |
| end_location   | text      |
| created_at     | timestamp |

### drivers

| Column         | Type |
| -------------- | ---- |
| id             | uuid |
| driver_name    | text |
| vehicle_number | text |
| status         | text |

### tracking_logs

| Column    | Type      |
| --------- | --------- |
| id        | uuid      |
| latitude  | numeric   |
| longitude | numeric   |
| timestamp | timestamp |

---

# ⚙️ Installation Guide

## 1️⃣ Clone Repository

```bash
git clone <repository-url>
```

## 2️⃣ Open Project Folder

```bash
cd aquaflow-smart-grid-main
```

## 3️⃣ Install Dependencies

Using npm:

```bash
npm install
```

Using bun:

```bash
bun install
```

---

# ▶️ Run the Project

## Development Mode

```bash
npm run dev
```

or

```bash
bun run dev
```

The application will run at:

```bash
http://localhost:5173
```

---

# 🏗️ Build Project

```bash
npm run build
```

---

# 🔍 Preview Production Build

```bash
npm run preview
```

---

# 🧪 Lint Project

```bash
npm run lint
```

---

# 🎨 Format Project

```bash
npm run format
```

---

# 📦 Main Dependencies

## Core Dependencies

* react
* react-dom
* typescript
* vite
* tailwindcss

## UI Libraries

* Radix UI
* ShadCN UI
* Lucide React

## Maps

* leaflet
* react-leaflet
* leaflet-routing-machine
* leaflet.heat

## Backend

* @supabase/supabase-js

---

# 🔐 Authentication

Authentication is handled using Supabase Authentication.

Possible authentication methods:

* Email & Password
* Google Login
* OTP Login
* Social Providers

---

# 📡 API & Backend

Backend services are managed using Supabase.

The platform can support:

* REST APIs
* Realtime updates
* Authentication APIs
* PostgreSQL queries
* File storage

---

# ☁️ Deployment

The project can be deployed on:

* Vercel
* Netlify
* Cloudflare Pages
* Firebase Hosting

---

# 🖥️ Important Files

| File                 | Purpose                          |
| -------------------- | -------------------------------- |
| package.json         | Project dependencies and scripts |
| vite.config.ts       | Vite configuration               |
| tsconfig.json        | TypeScript configuration         |
| .env                 | Environment variables            |
| supabase/config.toml | Supabase configuration           |
| wrangler.jsonc       | Cloudflare configuration         |

---

# 📸 Modules Included

## Components

* HeatmapView
* MapPicker
* RouteMap
* TrackingMap

## Portals

* MunicipalPortal
* DriverPortal
* UserPortal

## Routes

* Home Route
* Dashboard Route
* Authentication Route

---

# 🔧 Future Improvements

* AI-based water demand prediction
* IoT sensor integration
* Mobile application
* Real-time tanker monitoring
* Advanced analytics dashboard
* Notification system

---

# 👨‍💻 Developer Notes

This project uses:

* Modern React architecture
* Component-based structure
* Type-safe TypeScript development
* Cloud-based backend
* Responsive UI design

---

# 📄 License

This project is licensed under the MIT License.

---

# 🙌 Acknowledgements

Libraries and tools used:

* React
* Supabase
* Leaflet
* Vite
* Tailwind CSS
* TanStack Router
* ShadCN UI

---

# 📞 Support

If you face any issues:

1. Check environment variables
2. Verify Supabase configuration
3. Reinstall dependencies
4. Run the development server again

---

# ⭐ Conclusion

AquaFlow Smart Grid is a scalable smart water management platform that combines mapping, analytics, tracking, and cloud database technologies to create an efficient water distribution monitoring system.
