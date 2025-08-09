# Mindflow - AI-Powered Visual Learning App

## Overview

Mindflow is a comprehensive AI-powered visual learning web application that transforms messy text or voice input into interactive, visually appealing mind maps. The application uses artificial intelligence to generate structured mind maps and includes gamification elements, collaborative features, and study aids. Built as a full-stack solution with React frontend and Express backend, it provides a complete learning platform with user authentication, profile management, and progress tracking.

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
- **Database**: Supabase PostgreSQL cloud database
- **Backend Integration**: @supabase/supabase-js client for all database operations
- **Authentication**: Supabase Auth with email/password (no magic links)
- **Schema Structure**:
  - Profiles table for user data and gamification (XP, level) - linked to Supabase Auth users
  - Mindmaps table for storing generated mind maps with JSON content
  - XP transactions table for tracking experience point changes
  - Unlockables and user_unlockables tables for gamification features
  - Quizzes table for AI-generated quizzes from mindmaps
  - Flashcards table for AI-generated flashcard sets
  - Collab_sessions table for collaborative mind map editing with share tokens

### Key Features Architecture
- **AI Integration**: OpenAI GPT-4o-mini for mind map generation and chat assistance
- **Voice Input**: Web Speech API with audio processing for voice-to-text conversion
- **Mind Map Visualization**: Custom SVG-based interactive mind map component with drag-and-drop
- **Chat System**: Real-time AI assistant for mind map editing and refinement
- **Gamification**: XP system with levels, achievements, and unlockable themes/features
- **Export/Share**: Mind map export and collaboration via session tokens

### Authentication System
- **Strategy**: Supabase Auth with email/password authentication (no magic links)
- **Session Storage**: Supabase session tokens stored in localStorage, validated server-side
- **Authorization**: Express middleware validates Supabase JWT tokens for API access
- **Profile Management**: Automatic profile creation linked to Supabase Auth users

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o-mini model for mind map generation and conversational AI features
- **Speech Recognition**: Browser-native Web Speech API for voice input processing

### Database & Hosting
- **Supabase**: Cloud PostgreSQL database with built-in authentication
- **Database Connection**: @supabase/supabase-js for client and admin operations
- **Row Level Security**: Supabase RLS policies for data access control
- **Real-time Features**: Supabase real-time subscriptions for collaboration

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