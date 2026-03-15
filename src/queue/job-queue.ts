type JobHandler = (data: any) => Promise<void>;

interface Job {
  id: string;
  name: string;
  data: any;
  createdAt: Date;
}

/**
 * Simple In-Memory Job Queue
 *
 * Processes background tasks asynchronously without requiring Redis or any
 * external queue system. Jobs are processed via setTimeout to simulate
 * async/background behavior.
 *
 * Design Choice: For production, this would be replaced with Bull/Redis or
 * a similar persistent queue. For this assignment, an in-memory queue
 * demonstrates the same pattern without external dependencies.
 */
class JobQueue {
  private handlers: Map<string, JobHandler> = new Map();
  private jobCounter = 0;

  /**
   * Register a handler function for a specific job type
   */
  register(jobName: string, handler: JobHandler): void {
    this.handlers.set(jobName, handler);
    console.log(`📋 [Queue] Registered handler for job: "${jobName}"`);
  }

  /**
   * Enqueue a job for async processing
   * Uses setTimeout(fn, 0) to process the job in the next event loop tick,
   * simulating background processing behavior
   */
  enqueue(jobName: string, data: any): void {
    this.jobCounter++;
    const job: Job = {
      id: `job_${this.jobCounter}`,
      name: jobName,
      data,
      createdAt: new Date(),
    };

    console.log(`📥 [Queue] Job enqueued: "${jobName}" (ID: ${job.id})`);

    // Process asynchronously in the next tick (simulates background processing)
    setTimeout(async () => {
      const handler = this.handlers.get(jobName);
      if (!handler) {
        console.error(`❌ [Queue] No handler registered for job: "${jobName}"`);
        return;
      }

      try {
        console.log(`⚙️  [Queue] Processing job: "${jobName}" (ID: ${job.id})`);
        await handler(data);
        console.log(`✅ [Queue] Job completed: "${jobName}" (ID: ${job.id})`);
      } catch (error) {
        console.error(`❌ [Queue] Job failed: "${jobName}" (ID: ${job.id})`, error);
      }
    }, 0);
  }
}

// Export a singleton instance
export const jobQueue = new JobQueue();
