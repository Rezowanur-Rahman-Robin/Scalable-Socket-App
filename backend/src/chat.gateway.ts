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
