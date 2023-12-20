import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { worker } from "./worker";

// Shared Redis connection
const redisConnection = new IORedis({
  host: "localhost", // Your Redis server host
  port: 6379, // Your Redis server port
  maxRetriesPerRequest: null,
});

// Queue setup with explicit connection
const mainqueue = new Queue("mainqueue", {
  connection: redisConnection,
});

// Worker setup with explicit connection and listening to the correct queue
const mainworker = new Worker("mainqueue", worker, {
  connection: redisConnection,
});

// Worker event listeners
mainworker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

mainworker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

export default mainqueue;
