import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error(error);
    }
  }

  onModuleDestroy() {
    try {
      this.$disconnect();
    } catch (error) {
      console.error(error);
    }
  }
}
