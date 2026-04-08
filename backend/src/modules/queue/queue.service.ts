import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

export type JobProcessor<T = unknown, R = unknown> = (job: Job<T>) => Promise<R>;

export interface QueueConfig {
  name: string;
  processor: JobProcessor;
  concurrency?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: IORedis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.connection = new IORedis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    });

    this.connection.on('error', (err) => {
      this.logger.error('BullMQ Redis connection error', err);
    });

    this.logger.log('BullMQ connection initialized');
  }

  async onModuleDestroy() {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const events of this.queueEvents.values()) {
      await events.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connection.quit();
    this.logger.log('BullMQ connections closed');
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection: this.connection });
      this.queues.set(name, queue);
      this.logger.debug(`Queue ${name} created`);
    }
    return this.queues.get(name)!;
  }

  registerWorker<T = unknown, R = unknown>(
    queueName: string,
    processor: JobProcessor<T, R>,
    concurrency = 1,
  ): Worker<T, R> {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName) as Worker<T, R>;
    }

    const worker = new Worker<T, R>(queueName, processor, {
      connection: this.connection,
      concurrency,
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} in ${queueName} completed`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} in ${queueName} failed: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue ${queueName} with concurrency ${concurrency}`);

    return worker;
  }

  async addJob<T = unknown>(
    queueName: string,
    name: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(name, data, {
      removeOnComplete: 100,
      removeOnFail: 1000,
      ...options,
    });
    this.logger.debug(`Job ${job.id} added to ${queueName}`);
    return job;
  }

  async addBulkJobs<T = unknown>(
    queueName: string,
    jobs: Array<{ name: string; data: T; options?: JobsOptions }>,
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    const result = await queue.addBulk(
      jobs.map((j) => ({
        name: j.name,
        data: j.data,
        opts: {
          removeOnComplete: 100,
          removeOnFail: 1000,
          ...j.options,
        },
      })),
    );
    this.logger.debug(`${result.length} jobs added to ${queueName}`);
    return result;
  }

  async getJob<T = unknown>(queueName: string, jobId: string): Promise<Job<T> | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId) as Promise<Job<T> | undefined>;
  }

  async getJobState(queueName: string, jobId: string): Promise<string | null> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return null;
    return job.getState();
  }

  async getJobProgress(queueName: string, jobId: string): Promise<number | null> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return null;
    return job.progress as number;
  }

  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.debug(`Job ${jobId} removed from ${queueName}`);
    }
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  async drainQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();
    this.logger.log(`Queue ${queueName} drained`);
  }

  subscribeToEvents(
    queueName: string,
    callbacks: {
      onCompleted?: (jobId: string, result: unknown) => void;
      onFailed?: (jobId: string, error: Error) => void;
      onProgress?: (jobId: string, progress: number) => void;
    },
  ): QueueEvents {
    if (!this.queueEvents.has(queueName)) {
      const events = new QueueEvents(queueName, { connection: this.connection });
      this.queueEvents.set(queueName, events);
    }

    const events = this.queueEvents.get(queueName)!;

    if (callbacks.onCompleted) {
      events.on('completed', ({ jobId, returnvalue }) => {
        callbacks.onCompleted!(jobId, returnvalue);
      });
    }

    if (callbacks.onFailed) {
      events.on('failed', ({ jobId, failedReason }) => {
        callbacks.onFailed!(jobId, new Error(failedReason));
      });
    }

    if (callbacks.onProgress) {
      events.on('progress', ({ jobId, data }) => {
        callbacks.onProgress!(jobId, data as number);
      });
    }

    return events;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.connection.ping();
      return true;
    } catch {
      return false;
    }
  }
}
