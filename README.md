# Real-time Chat Application

A scalable real-time chat application built with React, NestJS, Socket.IO, and Redis Cluster.

## Features

- Real-time messaging
- Private chat between users
- Group chat rooms
- User presence indicators
- Scalable architecture with load balancing
- Redis Cluster for data persistence and pub/sub

## Tech Stack

- **Frontend**: React, Socket.IO Client
- **Backend**: NestJS, Socket.IO Server
- **Load Balancer**: NGINX
- **Database**: Redis Cluster
- **Container**: Docker

## Project Structure
Socket-App/
├── frontend/          # React application
├── backend/           # NestJS application
├── nginx/             # NGINX configuration
├── redis/            # Redis Cluster configuration
└── docker-compose.yml # Docker services configuration

## Prerequisites

- Docker
- Docker Compose
- Node.js (for local development)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd Socket-App
```
2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## Development
### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Backend Development
```bash
cd backend
npm install
npm run start:dev
```

## Architecture
- Multiple backend instances for scalability
- NGINX load balancer with sticky sessions
- Redis Cluster for data persistence and pub/sub messaging
- WebSocket connections for real-time communication
## Features in Detail
1. User Management
   
   - User registration with username
   - Online/offline status
   - User avatars
2. Chat Features
   
   - Private messaging
   - Group chat rooms
   - Real-time message delivery
   - Message history
3. Room Management
   
   - Create chat rooms
   - Join existing rooms
   - Room participant list
   - Room message history
## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
## License
MIT License

This README provides:
- Project overview
- Features list
- Technical stack details
- Setup instructions
- Development guidelines
- Architecture overview
- Contribution guidelines

You can customize it further based on your specific needs or additional features.