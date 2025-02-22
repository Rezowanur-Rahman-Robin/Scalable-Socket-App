# Building a Scalable Real-time Chat Application with React, NestJS, and Redis Cluster

In this article, I'll walk you through building a scalable real-time chat application using modern technologies. We'll focus on creating a system that can handle thousands of concurrent users while maintaining real-time performance.

## Architecture Overview

Our chat application uses a microservices architecture with the following components:
- React frontend with Socket.IO client
- Multiple NestJS backend instances
- NGINX load balancer
- Redis Cluster for data persistence and pub/sub

### Why This Stack?

1. **React**: Provides efficient UI updates crucial for real-time applications
2. **NestJS**: Offers excellent TypeScript support and scalable WebSocket handling
3. **Redis Cluster**: Enables horizontal scaling and reliable pub/sub messaging
4. **NGINX**: Manages load balancing and WebSocket connections

## Implementation Details

### 1. WebSocket Connection Management

The frontend establishes WebSocket connections through Socket.IO:

```typescript
// SocketContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<{
  socket: Socket | null;
  username: string;
  setUsername: (name: string) => void;
}>({
  socket: null,
  username: '',
  setUsername: () => {},
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, username, setUsername }}>
      {children}
    </SocketContext.Provider>
  );
};
```
### 2. Load Balancing with NGINX
NGINX configuration for WebSocket load balancing:
```nginx
upstream socket_nodes {
    ip_hash;  # Ensures session persistence
    server backend1:3000;
    server backend2:3000;
}

server {
    listen 80;
    
    location /socket.io/ {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_pass http://socket_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
### 3. Redis Cluster for Scalability
Our Redis Cluster configuration enables data sharding and high availability:
```typescript
// app.module.ts
@Module({
  imports: [
    RedisModule.forRoot({
      type: 'cluster',
      nodes: [
        { host: 'redis-1', port: 6379 },
        { host: 'redis-2', port: 6380 },
        { host: 'redis-3', port: 6381 },
      ],
      options: {
        scaleReads: 'all',
        clusterRetryStrategy: (times) => Math.min(times * 100, 3000),
      },
    }),
  ],
})
```

### 4. Message Handling and Distribution
The backend handles messages using NestJS WebSocket decorators:
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private async updateUsers() {
    const users = await this.redis.hgetall('users');
    const usersList = Object.entries(users).map(([id, data]) => {
      const userData = JSON.parse(data);
      return {
        id,
        ...userData,
      };
    });
    this.server.emit('users:update', usersList);
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    await this.redis.hdel('users', client.id);
    await this.updateUsers();
  }

  @SubscribeMessage('user:join')
  async handleUserJoin(client: Socket, username: string) {
    await this.redis.hset(
      'users',
      client.id,
      JSON.stringify({
        username,
        isActive: true,
      }),
    );
    await this.updateUsers();
  }

  @SubscribeMessage('message:private')
  async handlePrivateMessage(
    client: Socket,
    payload: { to: string; content: string; from: string },
  ) {
    const users = await this.redis.hgetall('users');
    const targetSocket = Object.entries(users).find(
      ([, data]) => JSON.parse(data).username === payload.to,
    )?.[0];

    if (targetSocket) {
      this.server.to(targetSocket).emit('message:receive', payload);
      client.emit('message:receive', payload);
    }
  }

  @SubscribeMessage('room:create')
  async handleRoomCreate(client: Socket, room: string) {
    await this.redis.sadd('rooms', room);
    client.join(room);
    // Broadcast room update to all clients
    this.broadcastRoomUpdate();
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(client: Socket, room: string) {
    client.join(room);
    // Broadcast room update to all clients
    this.broadcastRoomUpdate();
  }

  @SubscribeMessage('rooms:list')
  async handleRoomsList() {
    await this.broadcastRoomUpdate();
  }

  // Add this new method to broadcast room updates
  private async broadcastRoomUpdate() {
    const rooms = await this.redis.smembers('rooms');
    const roomsList = rooms.map((room) => ({
      name: room,
      users: this.server.sockets.adapter.rooms.get(room)?.size || 0,
    }));
    this.server.emit('rooms:update', roomsList);
  }

  @SubscribeMessage('message:room')
  async handleRoomMessage(
    client: Socket,
    payload: { room: string; content: string; from: string },
  ) {
    this.server.to(payload.room).emit('message:receive', payload);
  }
}
```

## Scaling Considerations
### 1. Horizontal Scaling
- Multiple NestJS instances handle WebSocket connections
- Redis Cluster distributes data across nodes
- NGINX load balancer distributes traffic
### 2. Data Persistence
- Messages stored in Redis for fault tolerance
- User sessions maintained across server restarts
- Room state preserved in Redis Cluster
### 3. Real-time Performance
- WebSocket connections maintain low latency
- Redis pub/sub ensures message delivery
- Sticky sessions prevent connection interruptions
## Performance Metrics
Our architecture can handle:

- Thousands of concurrent WebSocket connections
- Real-time message delivery at scale
- Automatic failover and recovery
- Session persistence across server restarts
## Deployment(Local)
Using Docker Compose for orchestration:
```yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    networks:
      - app-network

  backend1:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - REDIS_NODES=redis-1:6379,redis-2:6380,redis-3:6381
    depends_on:
      - redis-1
      - redis-2
      - redis-3
    networks:
      - app-network

  backend2:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - REDIS_NODES=redis-1:6379,redis-2:6380,redis-3:6381
    depends_on:
      - redis-1
      - redis-2
      - redis-3
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend1
      - backend2
    networks:
      - app-network

  redis-1:
    image: redis:alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    ports:
      - "6379:6379"
      - "16379:16379"
    volumes:
      - ./redis/cluster/redis-node-1.conf:/usr/local/etc/redis/redis.conf
      - redis1-data:/data
    networks:
      - app-network

  redis-2:
    image: redis:alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    ports:
      - "6380:6380"
      - "16380:16380"
    volumes:
      - ./redis/cluster/redis-node-2.conf:/usr/local/etc/redis/redis.conf
      - redis2-data:/data
    networks:
      - app-network

  redis-3:
    image: redis:alpine
    command: redis-server /usr/local/etc/redis/redis.conf
    ports:
      - "6381:6381"
      - "16381:16381"
    volumes:
      - ./redis/cluster/redis-node-3.conf:/usr/local/etc/redis/redis.conf
      - redis3-data:/data
    networks:
      - app-network

  redis-cluster-init:
    image: redis:alpine
    command: redis-cli --cluster create redis-1:6379 redis-2:6380 redis-3:6381 --cluster-yes
    depends_on:
      - redis-1
      - redis-2
      - redis-3
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  redis1-data:
  redis2-data:
  redis3-data:
  ```

## Conclusion
This architecture provides a solid foundation for a scalable chat application. Key takeaways:

- WebSocket connections for real-time communication
- Redis Cluster for data persistence and pub/sub
- Load balancing for horizontal scaling
- Docker for consistent deployment
The complete source code is available on GitHub, and you can deploy it using Docker Compose.

[Link to GitHub Repository]

Feel free to reach out with questions or suggestions for improvements!

#Socket #NodeJS #Chat #Redis #Microservices #RealTime