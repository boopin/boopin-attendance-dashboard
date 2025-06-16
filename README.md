# 🚀 Boopin Attendance Dashboard

A professional, real-time employee attendance tracking and analytics dashboard built with Next.js, TypeScript, and Supabase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/boopin-attendance-dashboard-v2)

## ✨ Features

### 📊 **Real-Time Analytics**
- **Daily Summary**: Comprehensive attendance statistics with on-time rates
- **Employee Details**: Individual check-in/check-out records with search and filtering
- **Weekly Reports**: Team performance analysis with expandable employee breakdowns
- **Monthly Reports**: Detailed individual employee monthly tracking

### 🎯 **Advanced Functionality**
- **Smart Search**: Real-time employee filtering by name or code
- **Data Export**: CSV export for all data views
- **Responsive Design**: Works perfectly on desktop and mobile
- **Interactive Tables**: Expandable rows with detailed daily breakdowns
- **Color-Coded Status**: Visual indicators for attendance categories

### 🏗️ **Clean Architecture**
- **Modular Components**: Each tab is a separate, maintainable component
- **Custom Hooks**: Reusable data management logic
- **TypeScript**: Full type safety throughout the application
- **Performance Optimized**: Efficient data loading and state management

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with React 19
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/boopin-attendance-dashboard-v2.git
   cd boopin-attendance-dashboard-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── page.tsx              # Main dashboard (235 lines - was 1500+!)
│   ├── layout.tsx            # App layout and metadata
│   └── globals.css           # Global styles
├── components/
│   └── dashboard/
│       ├── DailySummaryTab.tsx     # Daily attendance overview
│       ├── EmployeeDetailsTab.tsx  # Individual employee records
│       ├── WeeklyReportsTab.tsx    # Weekly team analysis
│       └── MonthlyReportsTab.tsx   # Monthly employee tracking
├── hooks/
│   ├── useAttendanceData.ts  # Daily/weekly data management
│   ├── useEmployeeData.ts    # Employee-specific operations
│   └── useDataExport.ts      # CSV export functionality
├── lib/
│   ├── types.ts              # TypeScript definitions
│   ├── supabase.ts           # Database client and queries
│   ├── formatters.ts         # Date/time formatting utilities
│   └── utils.ts              # General utility functions
└── constants/
    └── config.ts             # Application configuration
```

## 🗄️ Database Schema

The dashboard uses these Supabase tables:

### `daily_summaries`
- Daily attendance aggregations
- On-time rates and statistics
- Earliest/latest check-in times

### `daily_employee_records`
- Individual employee attendance records
- Check-in/check-out times
- Work hours and status

### `weekly_summaries`
- Weekly team performance metrics
- Perfect attendance tracking

### `employees`
- Master employee information
- Active status and departments

## 🎨 Features Showcase

### 📊 Daily Summary
- **Real-time statistics** with color-coded performance indicators
- **Trend analysis** showing attendance patterns
- **Quick insights** into team performance

### 👥 Employee Details
- **Advanced search** and filtering capabilities
- **Detailed records** with time categorization
- **Expandable views** for comprehensive data

### 📈 Weekly Reports
- **Team overview** with perfect attendance tracking
- **Individual breakdowns** with daily details
- **Performance metrics** for management insights

### 📅 Monthly Reports
- **Individual employee** monthly tracking
- **Comprehensive statistics** including work hours
- **Detailed daily records** for any employee

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations (see `/database/schema.sql`)
3. Set up Row Level Security (RLS) policies
4. Configure your environment variables

## 📈 Performance & Architecture

### Before Refactoring
- **1500+ lines** in a single file
- **Monolithic structure** with mixed concerns
- **Difficult to maintain** and debug
- **No code reusability**

### After Refactoring
- **235 lines** in main component (84% reduction!)
- **Modular architecture** with separation of concerns
- **Reusable components** and hooks
- **Professional-grade** maintainability

### Key Improvements
- **Custom Hooks**: Data management logic extracted and reusable
- **Component Architecture**: Each tab is independently maintainable
- **Type Safety**: Full TypeScript coverage with comprehensive types
- **Performance**: Optimized queries and efficient state management

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - automatic builds on every push

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=[https://github.com/YOUR_USERNAME/boopin-attendance-dashboard-v2](https://github.com/boopin/boopin-attendance-dashboard))

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Architecture**: Professional refactoring from monolithic to modular
- **Development**: Modern React patterns with TypeScript
- **Design**: Clean, responsive UI with Tailwind CSS
- **Database**: Optimized Supabase integration
