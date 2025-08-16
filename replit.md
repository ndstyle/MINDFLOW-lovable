# QuickLearned - AI-Powered Visual Learning App

## Overview

QuickLearned is a comprehensive AI-powered visual learning web application that transforms documents (PDF, TXT, DOCX) into interactive, visually appealing mind maps with integrated quiz functionality. The application uses artificial intelligence to generate structured mind maps and includes gamification elements, collaborative features, and study aids. Built as a full-stack solution with React frontend and Express backend, it provides a complete learning platform with user authentication, profile management, and progress tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with a custom dark theme design system featuring vibrant gradients
- **UI Components**: shadcn/ui component library providing consistent, accessible components
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions for user authentication
- **Password Security**: bcrypt for password hashing
- **API Design**: RESTful API endpoints with proper error handling and logging middleware

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Structure**:
  - Users table for authentication (username, email, password)
  - Profiles table for user data and gamification (XP, level)
  - Mindmaps table for storing generated mind maps with JSON content
  - XP transactions table for tracking experience point changes
  - Unlockables and user_unlockables tables for gamification features

### Key Features Architecture
- **AI Integration**: OpenAI GPT-4o-mini for mind map generation and chat assistance
- **Voice Input**: Web Speech API with audio processing for voice-to-text conversion
- **Mind Map Visualization**: Custom SVG-based interactive mind map component with drag-and-drop
- **Chat System**: Real-time AI assistant for mind map editing and refinement
- **Gamification**: XP system with levels, achievements, and unlockable themes/features
- **Export/Share**: Mind map export and collaboration via session tokens

### Authentication System
- **Strategy**: Email/password authentication without magic links
- **Session Storage**: Server-side sessions with secure HTTP-only cookies
- **Authorization**: Route-based protection with middleware authentication checks

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o-mini model for mind map generation and conversational AI features
- **Speech Recognition**: Browser-native Web Speech API for voice input processing

### Database & Hosting
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Database Connection**: @neondatabase/serverless with connection pooling
- **WebSocket Support**: ws library for Neon database connections

### UI & Styling
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon library
- **Class Variance Authority**: Type-safe component variant handling

### Development Tools
- **Vite**: Fast build tool with HMR and development server
- **TSX**: TypeScript execution for development server
- **ESBuild**: Fast bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Validation & Types
- **Zod**: Runtime type validation and schema definition
- **Drizzle Zod**: Integration between Drizzle ORM and Zod schemas
- **TypeScript**: Full type safety across frontend and backend