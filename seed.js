// Seed 100 posts using one Redis pipeline.
import { redis } from "./leaderboard.js";

async function seed() {
  try {
    await redis.del("trending:posts");
    const pipeline = redis.pipeline();

    for (let i = 1; i <= 100; i++) {
      const id = `post:${i}`;
      const score = Math.floor(Math.random() * 50);
      pipeline.hset(`${id}:meta`, "title", `Post number ${i}`, "author", `@user${i}`);
      pipeline.zadd("trending:posts", score, id);
    }

    const results = await pipeline.exec();
    const failed = results.find(([error]) => error);
    if (failed) throw failed[0];
    console.log("Seeded 100 posts.");
  } finally {
    redis.disconnect();
  }
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
