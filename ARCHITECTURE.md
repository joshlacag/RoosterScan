# RoosterScan System Architecture

## Overview
**Rooster Scan: Augmented Reality Assisted X-Ray Analysis for Rooster Injuries**

A comprehensive AI-powered platform for real-time rooster injury detection using computer vision, pose estimation, and augmented reality.

## System Architecture

### Frontend Layer (React + TypeScript)
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│  Camera Interface  │  AR Overlay  │  Analysis Dashboard     │
│  - WebRTC Stream   │  - 3D Models │  - Real-time Results    │
│  - Video Controls  │  - Pose Viz  │  - Injury Reports       │
│  - Capture Tools   │  - Overlays  │  - Progress Tracking    │
├─────────────────────────────────────────────────────────────┤
│              AI Processing Layer (Client-Side)              │
│  - TensorFlow Lite │  - Pose Est. │  - Injury Detection     │
│  - Computer Vision │  - ML Models │  - Real-time Analysis   │
└─────────────────────────────────────────────────────────────┘
```

### Backend Layer (Node.js + Express)
```
┌─────────────────────────────────────────────────────────────┐
│                     Backend Services                        │
├─────────────────────────────────────────────────────────────┤
│   Auth Service   │   Data Service   │   Analysis Service    │
│   - Supabase     │   - CRUD APIs    │   - Report Gen        │
│   - JWT Tokens   │   - File Upload  │   - Progress Track    │
│   - User Mgmt    │   - Data Sync    │   - Notifications     │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│   - Supabase PostgreSQL (User Data, Roosters, Scans)       │
│   - File Storage (Images, Videos, 3D Models)               │
│   - Real-time Subscriptions (Live Updates)                 │
└─────────────────────────────────────────────────────────────┘
```

### AI/ML Pipeline
```
┌─────────────────────────────────────────────────────────────┐
│                    AI Processing Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│  Video Input → Preprocessing → Pose Detection → Analysis    │
│      ↓              ↓              ↓             ↓         │
│  WebRTC Stream → Frame Extract → Key Points → Injury Det   │
│      ↓              ↓              ↓             ↓         │
│  Real-time     → Normalization → Skeleton    → Classification│
│      ↓              ↓              ↓             ↓         │
│  AR Overlay    ← 3D Rendering  ← Anatomical  ← Report Gen  │
└─────────────────────────────────────────────────────────────┘
```

## Core Technologies

### Frontend Stack
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **TensorFlow.js/Lite** - Client-side ML
- **Three.js** - 3D Rendering & AR
- **WebRTC** - Camera Access
- **Canvas API** - Real-time Drawing
- **Tailwind CSS** - Styling

### Backend Stack
- **Node.js + Express** - Server Runtime
- **Supabase** - Database & Auth
- **PostgreSQL** - Relational Data
- **File Storage** - Images/Videos/Models
- **WebSocket** - Real-time Updates

### AI/ML Stack
- **TensorFlow Lite** - Model Inference
- **PoseNet/MoveNet** - Pose Estimation
- **Custom CNN** - Injury Classification
- **OpenCV.js** - Computer Vision
- **MediaPipe** - Real-time Processing

## Data Flow

### Real-time Analysis Flow
1. **Camera Capture** → WebRTC video stream
2. **Frame Processing** → Extract frames at 30fps
3. **Pose Detection** → Identify rooster skeleton
4. **Injury Analysis** → ML classification
5. **AR Overlay** → 3D anatomical visualization
6. **Report Generation** → Store results & insights

### User Workflow
1. **Authentication** → Supabase login
2. **Rooster Registration** → Add bird profiles
3. **Live Scanning** → Real-time analysis
4. **Injury Detection** → AI-powered diagnosis
5. **Progress Tracking** → Historical data
6. **Educational Content** → Anatomy learning

## Security & Performance

### Security
- JWT-based authentication
- Encrypted data transmission
- Secure file uploads
- Privacy-compliant data handling

### Performance
- Client-side ML inference
- WebGL acceleration
- Optimized model sizes
- Real-time processing (30fps)
- Progressive loading

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- CDN for static assets
- Database connection pooling
- Load balancing

### Model Management
- Versioned ML models
- A/B testing framework
- Model performance monitoring
- Continuous learning pipeline
