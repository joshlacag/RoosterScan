# RoosterScan

AI-powered rooster health monitoring system using computer vision and pose estimation for comprehensive health analysis.

## Features

### 🎯 Core Capabilities
- **Live Camera Scanning**: Real-time rooster pose detection with 17 keypoints
- **Image Upload Analysis**: Static image analysis with professional results
- **Sequential AI Validation**: Quality gating system for improved accuracy
- **Bumblefoot Detection**: 100% accuracy specialized model
- **Health Recommendations**: Clinical-grade diagnostic guidance

### 📊 Management & Tracking
- **Rooster Profiles**: Breed, age, and health history management
- **Scan History**: Complete analysis history with timestamps
- **Health Reports**: Detailed assessments with confidence scores
- **Progress Tracking**: Monitor health improvements over time

### 🎓 Educational Content
- **Anatomy Learning**: Interactive rooster anatomy education
- **Injury Prevention**: Best practices and care guidelines

## Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **TailwindCSS** + Radix UI components
- **Camera API** for live video streaming
- **Canvas API** for keypoint visualization

### Backend
- **Express.js** + Node.js API server
- **Python Integration** for YOLO model inference
- **SQLite Database** for data persistence
- **Supabase Authentication** for user management

### AI Models
- **Custom YOLO Pose Detection**: 395 annotated rooster images
- **Bumblefoot Classification**: 100% accuracy on 240 images
- **Sequential Validation**: Novel quality gating approach

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### API Endpoints

- `GET/POST/PUT/DELETE /api/roosters` - Rooster management
- `GET/POST /api/scans` - X-ray scan operations  
- `GET/POST /api/reports` - Health report generation
- `GET /api/auth/session` - Authentication status
- `GET /health` - Server health check

### Authentication

For development, add the `x-user` header with your email to authenticate API requests.

## Project Structure

```
client/                 # React frontend
├── pages/             # Route components
├── components/        # Reusable UI components
├── lib/              # Utilities and API client
└── hooks/            # Custom React hooks

server/                # Express backend
├── routes/           # API route handlers
└── index.ts          # Server configuration

shared/               # Shared TypeScript types
└── api.ts           # API interfaces and types
```

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run typecheck    # TypeScript validation
npm run test         # Run tests
```

## Deployment

### Node.js Server
```bash
npm run build
npm start
```

### Netlify (Serverless)
The project includes Netlify configuration for serverless deployment with automatic SPA routing.

## License

Private - Academic Project
