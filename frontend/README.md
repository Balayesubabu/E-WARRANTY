# E-Warrantify

A comprehensive warranty management system with role-based access control, designed to streamline warranty registration, verification, and management for customers, dealers, staff, and brand owners.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Development Workflow](#development-workflow)
- [User Roles & Workflows](#user-roles--workflows)
- [Key Components](#key-components)
- [Routing Structure](#routing-structure)
- [State Management](#state-management)
- [Design System](#design-system)
- [Build & Deployment](#build--deployment)

## 🎯 Overview

E-Warrantify is a modern, responsive web application built with React that provides a complete warranty management solution. The system supports four distinct user roles (Customer, Dealer, Staff, and Owner), each with tailored interfaces and functionalities. The application features role-based routing, protected routes, and a demo mode for testing different user perspectives.

### Key Highlights

- **Multi-Role System**: Four distinct user roles with customized dashboards
- **Protected Routes**: Secure navigation based on authentication status
- **Role Switching**: Demo mode allows instant role switching for testing
- **Modern UI**: Built with Radix UI components and Tailwind CSS
- **Responsive Design**: Mobile-first approach with beautiful gradients and animations
- **Warranty Management**: Complete lifecycle management from registration to verification

## ✨ Features

### Core Functionality

- **Warranty Registration**: Register products with warranty information
- **Warranty Verification**: Verify warranty authenticity via QR codes or warranty codes
- **Role-Based Dashboards**: Customized interfaces for each user type
- **Analytics**: Comprehensive analytics and reporting for owners and dealers
- **Profile Management**: User profile editing and management
- **Notifications**: Real-time notification center
- **Support System**: Support tickets and warranty claims management

### Role-Specific Features

#### Customer
- View all owned warranties
- Track warranty expiry dates
- Verify warranty authenticity
- Access warranty certificates
- Self-registration for products

#### Dealer
- Register products for customers
- Generate warranty codes
- Verify warranties
- View registration analytics
- Manage approval queue

#### Staff
- Handle warranty claims
- Manage support tickets
- Process customer requests
- View system activity

#### Owner
- Executive dashboard with system overview
- Dealer management and approval
- Bulk warranty upload
- Activity logs and monitoring
- Advanced analytics
- System health monitoring

## 🛠 Tech Stack

### Core Technologies

- **React 18.3.1**: UI library
- **React Router DOM 7.12.0**: Client-side routing
- **Vite 6.3.5**: Build tool and dev server
- **TypeScript**: Type safety (config files)

### UI Libraries

- **Radix UI**: Accessible component primitives
  - Dialog, Dropdown, Select, Tabs, Accordion, and more
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Motion (Framer Motion)**: Animation library
- **Sonner**: Toast notifications

### Form & Data Management

- **React Hook Form 7.55.0**: Form state management
- **Recharts 2.15.2**: Charting library for analytics
- **Canvas Confetti**: Celebration animations

### Additional Libraries

- **React Day Picker**: Date selection
- **Input OTP**: OTP input component
- **Embla Carousel**: Carousel component
- **CMDK**: Command menu component

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   │   └── Analytics.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── OTPVerification.jsx
│   │   │   ├── RoleSelection.jsx
│   │   │   └── SignUp.jsx
│   │   ├── common/
│   │   │   ├── DemoGuide.jsx
│   │   │   ├── NotificationCenter.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── QuickActionCard.jsx
│   │   │   └── RoleSwitcher.jsx
│   │   ├── customer/
│   │   │   ├── CustomerSelfRegister.jsx
│   │   │   └── WarrantyCertificate.jsx
│   │   ├── dashboard/
│   │   │   ├── CustomerHome.jsx
│   │   │   ├── DealerHome.jsx
│   │   │   ├── Home.jsx (Router component)
│   │   │   ├── OwnerHome.jsx
│   │   │   └── StaffHome.jsx
│   │   ├── dealer/
│   │   │   └── ApprovalQueue.jsx
│   │   ├── owner/
│   │   │   ├── ActivityLogs.jsx
│   │   │   ├── BulkWarrantyUpload.jsx
│   │   │   └── DealerManagement.jsx
│   │   ├── profile/
│   │   │   ├── EditProfile.jsx
│   │   │   └── Profile.jsx
│   │   ├── staff/
│   │   │   ├── SupportTickets.jsx
│   │   │   └── WarrantyClaims.jsx
│   │   ├── warranty/
│   │   │   ├── RegisterProduct.jsx
│   │   │   └── VerifyWarranty.jsx
│   │   └── ui/ (48+ shadcn/ui components)
│   ├── contexts/
│   │   └── UserContext.jsx (Global state management)
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx (Main routing component)
│   ├── main.jsx (Application entry point)
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation Steps

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will start on `http://localhost:3000` and automatically open in your browser.

3. **Build for Production**

   ```bash
   npm run build
   ```

   The production build will be created in the `build` directory.

## 🔄 Development Workflow

### Application Flow

```
1. Onboarding (3 slides)
   ↓
2. Role Selection (Customer / Dealer / Staff / Owner)
   ↓
3. Authentication (Login / Sign Up)
   ↓
4. OTP Verification (if required)
   ↓
5. Role-Specific Dashboard
   ↓
6. Feature Navigation
   ↓
7. Profile Management
```

### Entry Point

The application starts at `main.jsx`, which:
- Sets up React Router for navigation
- Wraps the app with `UserProvider` for global state
- Renders the main `App` component

### Routing Logic

- **Public Routes**: Onboarding, Role Selection, Login, Sign Up, OTP Verification
- **Protected Routes**: All other routes require authentication
- **Role-Based Rendering**: Dashboard component (`Home.jsx`) renders different components based on user role
- **Fallback**: Unauthenticated users are redirected to role selection

## 👥 User Roles & Workflows

### Customer Role

**Theme**: Blue/Indigo gradient  
**Primary Functions**:
- View warranty portfolio
- Track warranty expiry dates
- Verify warranty authenticity
- Access warranty certificates
- Self-register products

**Key Routes**:
- `/home` - Customer dashboard
- `/verify` - Verify warranty
- `/certificate` - View warranty certificate
- `/customer-register` - Self-registration

### Dealer Role

**Theme**: Cyan/Blue gradient  
**Primary Functions**:
- Register products for customers
- Generate warranty codes
- Verify warranties
- View analytics
- Manage approval queue

**Key Routes**:
- `/home` - Dealer dashboard
- `/register` - Register product
- `/verify` - Verify warranty
- `/analytics` - View analytics
- `/approval-queue` - Manage approvals

### Staff Role

**Theme**: Emerald/Teal gradient  
**Primary Functions**:
- Handle warranty claims
- Manage support tickets
- Process customer requests
- View system activity

**Key Routes**:
- `/home` - Staff dashboard
- `/warranty-claims` - Manage claims
- `/support-tickets` - Handle tickets

### Owner Role

**Theme**: Purple/Pink gradient  
**Primary Functions**:
- System overview and monitoring
- Dealer management and approval
- Bulk warranty operations
- Advanced analytics
- Activity logs

**Key Routes**:
- `/home` - Owner dashboard
- `/dealer-management` - Manage dealers
- `/bulk-upload` - Bulk warranty upload
- `/activity-logs` - System activity
- `/analytics` - Advanced analytics

## 🧩 Key Components

### Authentication Components

- **RoleSelection**: Initial role selection screen
- **Login**: Role-aware login form
- **SignUp**: Role-aware registration form
- **OTPVerification**: OTP verification screen

### Dashboard Components

- **Home**: Router component that renders role-specific dashboards
- **CustomerHome**: Customer-specific dashboard
- **DealerHome**: Dealer-specific dashboard
- **OwnerHome**: Owner-specific dashboard
- **StaffHome**: Staff-specific dashboard

### Common Components

- **ProtectedRoute**: HOC for route protection
- **RoleSwitcher**: Demo mode role switching (floating button)
- **DemoGuide**: Instructional banner for demo mode
- **NotificationCenter**: Notification management
- **QuickActionCard**: Reusable action card component

### Warranty Components

- **RegisterProduct**: Product registration form
- **VerifyWarranty**: Warranty verification interface
- **WarrantyCertificate**: Warranty certificate display

### Management Components

- **DealerManagement**: Owner's dealer management interface
- **ApprovalQueue**: Dealer's approval queue
- **BulkWarrantyUpload**: Bulk upload interface
- **ActivityLogs**: System activity logs
- **WarrantyClaims**: Staff warranty claims management
- **SupportTickets**: Staff support ticket management

## 🗺 Routing Structure

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to `/onboarding` |
| `/onboarding` | Onboarding | Initial onboarding slides |
| `/role-selection` | RoleSelection | Role selection screen |
| `/login` | Login | Login form |
| `/signup` | SignUp | Registration form |
| `/otp` | OTPVerification | OTP verification |

### Protected Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/home` | Home | Role-based dashboard |
| `/register` | RegisterProduct | Product registration |
| `/verify` | VerifyWarranty | Warranty verification |
| `/analytics` | Analytics | Analytics dashboard |
| `/profile` | Profile | User profile view |
| `/edit-profile` | EditProfile | Profile editing |
| `/dealer-management` | DealerManagement | Owner: Manage dealers |
| `/approval-queue` | ApprovalQueue | Dealer: Approval queue |
| `/notifications` | NotificationCenter | Notification center |
| `/customer-register` | CustomerSelfRegister | Customer self-registration |
| `/owner-register-customer` | CustomerSelfRegister | Owner registers customer |
| `/certificate` | WarrantyCertificate | Warranty certificate |
| `/bulk-upload` | BulkWarrantyUpload | Owner: Bulk upload |
| `/activity-logs` | ActivityLogs | Owner: Activity logs |
| `/warranty-claims` | WarrantyClaims | Staff: Warranty claims |
| `/support-tickets` | SupportTickets | Staff: Support tickets |

## 🔐 State Management

### UserContext

The application uses React Context API for global state management through `UserContext.jsx`.

**State Properties**:
- `user`: Current user object with role, name, company, etc.
- `selectedRole`: Currently selected role

**Methods**:
- `handleLogin(userData)`: Sets user data after login
- `handleLogout()`: Clears user data and selected role
- `handleRoleSwitch(newRole)`: Switches user role (demo mode)

**Usage**:
```jsx
import { useUser } from './contexts/UserContext';

function MyComponent() {
  const { user, handleLogin, handleLogout } = useUser();
  // Use user data and methods
}
```

## 🎨 Design System

### Color Schemes by Role

- **Customer**: `from-blue-500 to-indigo-600`
- **Dealer**: `from-cyan-500 to-blue-600`
- **Staff**: `from-emerald-500 to-teal-600`
- **Owner**: `from-purple-500 to-pink-600`

### Design Principles

- **Rounded Corners**: 12-16px radius for cards and buttons
- **Shadows**: Soft shadows on cards for depth
- **Icons**: Lucide React icons throughout
- **Animations**: Motion (Framer Motion) for smooth transitions
- **Typography**: Inter/Poppins font family
- **Responsive**: Mobile-first approach

### UI Component Library

The project uses shadcn/ui components built on Radix UI primitives. All components are located in `src/components/ui/` and include:

- Buttons, Cards, Dialogs
- Forms, Inputs, Selects
- Navigation, Menus, Tabs
- Charts, Tables, Calendars
- And 40+ more components

## 🏗 Build & Deployment

### Development

```bash
npm run dev
```

- Starts Vite dev server on port 3000
- Hot Module Replacement (HMR) enabled
- Automatic browser opening

### Production Build

```bash
npm run build
```

- Creates optimized production build
- Output directory: `build/`
- Target: ESNext
- Includes code splitting and minification

### Build Configuration

The build is configured in `vite.config.ts`:
- React SWC plugin for fast compilation
- Path aliases for cleaner imports
- Custom port and auto-open for dev server
- ESNext target for modern browsers

## 📝 Development Notes

### Demo Mode

The application includes a demo mode feature:
- **RoleSwitcher**: Floating button (bottom-right) for instant role switching
- **DemoGuide**: Instructional banner on first login
- Allows testing all roles without multiple accounts

### Protected Routes

All protected routes are wrapped with `ProtectedRoute` component:
- Checks for authenticated user
- Redirects to `/role-selection` if not authenticated
- Allows access if user exists

### Role-Based Rendering

The `Home` component uses a switch statement to render role-specific dashboards:
- Dynamically loads appropriate dashboard based on `user.role`
- Falls back to `DealerHome` if role is undefined

## 🔮 Future Enhancements

Potential features for future development:

- Backend API integration
- Real database connectivity
- Authentication with JWT tokens
- Email notifications
- PDF generation for certificates
- QR code scanning functionality
- Mobile app version
- Advanced reporting and exports
- Multi-language support
- Dark mode theme

## 📄 License

This project is part of the E-Warrantify development suite.

## 🤝 Contributing

When contributing to this project:
1. Follow the existing code structure
2. Maintain role-based component organization
3. Use the established design system
4. Write clear component documentation
5. Test across all user roles

---

**Built with ❤️ using React, Vite, and modern web technologies**
