# Intellinez Monitoring Dashboard

A comprehensive website monitoring dashboard that provides real-time monitoring, health status tracking, and detailed analytics for web applications and services.

## 🚀 Project Overview

Intellinez Monitoring Dashboard is a modern web application designed to monitor website uptime, performance, and health metrics for Intellinez Systems. It provides business and developers with critical insights into our web infrastructure through an intuitive dashboard, real-time alerts, and comprehensive logging capabilities.

### Why Intellinez Monitoring Dashboard?

- **Real-time Monitoring**: Track website uptime and performance metrics in real-time
- **Comprehensive Analytics**: Detailed response time charts, status code tracking, and error monitoring
- **User-friendly Dashboard**: Clean, modern interface built with React and TailwindCSS
- **Scalable Architecture**: Built on Supabase for reliable data storage and real-time updates
- **Advanced Filtering**: Filter logs by time range, health status, and error conditions
- **Export Capabilities**: Export monitoring data to CSV for further analysis

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development experience
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality component library
- **Lucide React** - Beautiful, customizable icons
- **Chart.js** - Interactive data visualization

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service (Database, Auth, Real-time)
- **PostgreSQL** - Robust relational database

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📋 Features

### Core Monitoring Features
- ✅ **Website Health Monitoring** - Track uptime and availability
- ✅ **Response Time Tracking** - Monitor performance metrics
- ✅ **Status Code Monitoring** - HTTP response code tracking
- ✅ **SSL Certificate Monitoring** - SSL/TLS certificate validation
- ✅ **Proxy Server Detection** - Identify proxy configurations
- ✅ **Error Logging** - Comprehensive error tracking and reporting

### Dashboard Features
- ✅ **Real-time Dashboard** - Live monitoring overview
- ✅ **Interactive Charts** - Response time trends and analytics
- ✅ **Advanced Filtering** - Filter by time range, status, and error conditions
- ✅ **Detailed Logs** - Comprehensive monitoring history
- ✅ **Export Functionality** - CSV export for data analysis
- ✅ **Responsive Design** - Mobile-friendly interface

### Authentication & Security
- ✅ **JWT Authentication** - Secure user authentication via Supabase
- ✅ **Protected Routes** - Route-level access control
- ✅ **User Management** - User registration and profile management

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Supabase Account** - For backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/intellinez-com/Intellinez-Monitoring-Dashboard.git
   cd Intellinez-Monitoring-Dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to `http://localhost:5173` in your browser.

## 📁 Project Structure

```
insight-health-portal/
├── public/                    # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components  
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── .env.local              # Environment variables
├── tailwind.config.js      # TailwindCSS configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Project dependencies
```

## ⚙️ Environment Variables

The following environment variables are required to run the application:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |

### How to get Supabase credentials:

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API
3. Copy the Project URL and anon public key
4. Add them to your `.env.local` file

## 🗄️ Database Schema

The application uses the following main tables:

- **`websites`** - Website configuration and metadata
- **`website_monitoring_logs`** - Monitoring history and metrics
- **`users`** - User authentication and profiles

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Shadcn/UI](https://ui.shadcn.com) - Component library
- [TailwindCSS](https://tailwindcss.com) - CSS framework
- [Chart.js](https://www.chartjs.org) - Data visualization

---

Built with ❤️ by the Intellinez Systems team
