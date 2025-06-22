# ProjectFlow - Student Project Management System

A comprehensive web-based platform for managing student project topics, supervisor allocation, and academic workflow in educational institutions.

## 🎯 Project Overview

ProjectFlow is a modern, full-stack web application designed to streamline the academic project management process in universities and colleges. The system facilitates intelligent student-supervisor allocation, project topic approval workflows, and submission management across multiple departments and academic sessions.

## 🚀 Key Features

### 🔐 Role-Based Access Control
- **Admin**: System-wide management and oversight
- **Coordinator**: Department-level project and allocation management
- **Supervisor**: Student mentorship and project guidance
- **Student**: Project submission and progress tracking

### 🎓 Academic Session Management
- Multi-session support for different academic years
- Session-based student enrollment and allocation
- Historical data preservation across sessions

### 🤖 Intelligent Allocation System
- AI-powered student-supervisor matching based on research interests
- Capacity-aware allocation respecting supervisor limits
- Similarity scoring for optimal research area alignment

### 📊 Comprehensive Dashboards
- Real-time statistics and analytics
- Interactive charts and data visualization
- Role-specific insights and metrics

### 📁 Project Lifecycle Management
- Project topic submission and approval workflow
- Status tracking from submission to completion
- File upload and submission management

### 🏢 Multi-Department Support
- Department isolation and management
- Department-specific coordinators and workflows
- Cross-department reporting for administrators

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 13.5.1 (React 18.2.0)
- **Styling**: Tailwind CSS 3.3.3
- **UI Components**: PrimeReact 10.2.1
- **Icons**: Lucide React, PrimeIcons
- **Animations**: Framer Motion 10.16.16
- **Charts**: Recharts 2.15.3
- **Forms**: React Hook Form 7.53.0
- **Notifications**: Sonner 1.4.0

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Authentication**: NextAuth.js 4.24.5
- **Database ORM**: Prisma 5.7.1
- **Password Hashing**: bcryptjs 2.4.3
- **File Upload**: Multer 1.4.5-lts.1

### Database
- **Primary**: PostgreSQL (via Supabase)
- **ORM**: Prisma with type-safe queries
- **Migrations**: Prisma Migrate

### Development Tools
- **Language**: JavaScript/TypeScript
- **Linting**: ESLint
- **Package Manager**: npm
- **Version Control**: Git

## 📁 Project Structure

```
projectflow/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin-specific endpoints
│   │   ├── coordinator/         # Coordinator-specific endpoints
│   │   ├── supervisor/          # Supervisor-specific endpoints
│   │   ├── student/             # Student-specific endpoints
│   │   └── auth/                # Authentication endpoints
│   ├── auth/                    # Authentication pages
│   ├── dashboard/               # Role-based dashboards
│   │   ├── admin/              # Admin dashboard
│   │   ├── coordinator/        # Coordinator dashboard
│   │   ├── supervisor/         # Supervisor dashboard
│   │   └── student/            # Student dashboard
│   ├── globals.css             # Global styles
│   ├── layout.js               # Root layout
│   └── page.js                 # Landing page
├── components/                  # Reusable UI components
│   ├── ui/                     # Shadcn/ui components
│   ├── DashboardChart.js       # Chart components
│   ├── StatisticsCard.js       # Statistics display
│   └── Spinner/                # Loading components
├── features/                   # Feature-specific components
│   └── Users/                  # User management components
├── lib/                        # Utility libraries
│   ├── auth.js                 # Authentication configuration
│   ├── prisma.js               # Database client
│   └── utils.ts                # Utility functions
├── prisma/                     # Database schema and migrations
│   ├── migrations/             # Database migrations
│   ├── schema.prisma           # Database schema
│   └── seed.js                 # Database seeding
├── hooks/                      # Custom React hooks
├── middleware.js               # Next.js middleware
└── package.json               # Dependencies and scripts
```

## 🔄 Application Workflow

### 1. User Registration & Authentication
```
Student Registration → Department Selection → Session Assignment → Account Creation
Admin/Staff Creation → Role Assignment → Department Assignment → First Login Password Change
```

### 2. Project Submission Workflow
```
Student Login → Project Topic Submission → Coordinator Review → Approval/Rejection → Supervisor Assignment
```

### 3. Allocation Process
```
Session Setup → Student Enrollment → Supervisor Capacity Setting → Algorithm Execution → Allocation Results
```

### 4. Project Management Lifecycle
```
Topic Approval → Supervisor Assignment → Project Execution → Submission Upload → Review & Grading
```

## 🎯 Core Features Breakdown

### Admin Dashboard
- **System Overview**: Total users, departments, projects statistics
- **User Management**: Create, edit, delete users across all roles
- **Department Management**: Add, modify departments and their details
- **System Analytics**: Comprehensive reporting and data visualization
- **Session Management**: Create and manage academic sessions

### Coordinator Dashboard
- **Department Overview**: Department-specific statistics and metrics
- **Supervisor Management**: Add and manage department supervisors
- **Student Oversight**: Monitor department students and their progress
- **Project Approval**: Review and approve/reject project topics
- **Allocation Management**: Run intelligent student-supervisor allocation
- **Department Analytics**: Charts and insights for department performance

### Supervisor Dashboard
- **Student Portfolio**: View and manage assigned students
- **Project Monitoring**: Track student project progress
- **Submission Review**: Review and provide feedback on submissions
- **Capacity Management**: Monitor student load and availability
- **Research Area Matching**: View allocation based on research interests

### Student Dashboard
- **Project Submission**: Submit project topics for approval
- **Progress Tracking**: Monitor project status and feedback
- **Supervisor Information**: View assigned supervisor details
- **File Submission**: Upload project files and documents
- **Academic Progress**: Track submission history and grades

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Environment Variables
Create a `.env.local` file with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/projectflow"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-username/projectflow.git
cd projectflow
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup database**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

4. **Start development server**
```bash
npm run dev
```

5. **Access the application**
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 Default User Accounts

After seeding, you can login with these accounts:

| Role | Email | Password | Department |
|------|-------|----------|------------|
| Admin | admin@system.com | password | System |
| Coordinator | coordinator.cs@system.com | password | Computer Science |
| Supervisor | supervisor1.cs@system.com | password | Computer Science |
| Student | alice.student@system.com | password | Computer Science |

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/register` - Student registration
- `POST /api/auth/change-password` - Password change

### Admin APIs
- `GET /api/admin/stats` - System statistics
- `GET/POST/PUT/DELETE /api/admin/users` - User management
- `GET/POST/PUT/DELETE /api/admin/departments` - Department management

### Coordinator APIs
- `GET /api/coordinator/stats` - Department statistics
- `GET /api/coordinator/supervisors` - Department supervisors
- `GET /api/coordinator/students` - Department students
- `GET /api/coordinator/projects` - Department projects
- `POST /api/coordinator/allocate` - Run allocation algorithm

### Supervisor APIs
- `GET /api/supervisor/stats` - Supervisor statistics
- `GET /api/supervisor/students` - Assigned students
- `GET /api/supervisor/projects` - Supervised projects
- `GET /api/supervisor/submissions` - Student submissions

### Student APIs
- `GET /api/student/stats` - Student statistics
- `GET/POST /api/student/projects` - Student projects
- `GET /api/student/submissions` - Student submissions

## 🤖 Intelligent Allocation Algorithm

The system features a sophisticated allocation algorithm that:

1. **Analyzes Research Compatibility**: Compares student and supervisor research areas using text similarity
2. **Respects Capacity Limits**: Ensures supervisors don't exceed their maximum student limits
3. **Optimizes Distribution**: Balances workload across available supervisors
4. **Prioritizes by Registration**: Considers student registration order for fairness
5. **Provides Similarity Scoring**: Quantifies match quality for transparency

### Algorithm Flow
```
1. Fetch unallocated students for session
2. Fetch available supervisors with capacity
3. Calculate similarity scores for each student-supervisor pair
4. Sort by similarity and capacity availability
5. Assign students to best-matching supervisors
6. Update supervisor capacity in real-time
7. Generate allocation report
```

## 📊 Database Schema

### Core Entities
- **Users**: Multi-role user management with department relationships
- **Departments**: Academic departments with coordinators
- **Sessions**: Academic year/semester management
- **Projects**: Student project topics and status tracking
- **Submissions**: File uploads and grading system
- **Allocations**: Student-supervisor assignments per session

### Key Relationships
- One-to-One: Department ↔ Coordinator
- One-to-Many: Department → Supervisors/Students
- Many-to-Many: Students ↔ Supervisors (via Allocations)
- One-to-Many: Project → Submissions

## 🔒 Security Features

- **Authentication**: Secure JWT-based authentication with NextAuth.js
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Secure session handling and timeout
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions for uploads

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Enhanced experience on tablets
- **Desktop Optimization**: Full-featured desktop interface
- **Cross-Browser**: Compatible with modern browsers
- **Accessibility**: WCAG compliance considerations

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Considerations
- Set `NODE_ENV=production`
- Configure production database
- Set secure `NEXTAUTH_SECRET`
- Configure proper `NEXTAUTH_URL`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## 🔮 Future Enhancements

- **Real-time Notifications**: WebSocket-based live updates
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: React Native companion app
- **Integration APIs**: Third-party system integrations
- **Advanced Reporting**: PDF generation and export features
- **Collaboration Tools**: Built-in messaging and video calls

---

**ProjectFlow** - Streamlining Academic Excellence Through Intelligent Project Management