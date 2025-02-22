import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RedisModule } from '@nestjs-modules/ioredis';

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
  providers: [ChatGateway],
})
export class AppModule {}
