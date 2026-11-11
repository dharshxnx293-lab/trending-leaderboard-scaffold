// leaderboard.js — Redis sorted-set ranking + per-post metadata hashes.
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

const LEADERBOARD_KEY = "trending:posts";

/** Record one unit of engagement with one atomic Redis command. */
export async function upvote(postId) {
  return redis.zincrby(LEADERBOARD_KEY, 1, postId);
}

/** Return the top N posts, including their metadata, using one pipeline. */
export async function getTop(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new TypeError("n must be a non-negative integer");
  }
  if (n === 0) return [];

  const ranked = await redis.zrevrange(LEADERBOARD_KEY, 0, n - 1, "WITHSCORES");
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < ranked.length; i += 2) {
    const id = ranked[i];
    rows.push({ id, score: Number(ranked[i + 1]) });
    pipeline.hgetall(`${id}:meta`);
  }

  const results = await pipeline.exec();
  return rows.map((row, i) => {
    const [error, metadata] = results[i];
    if (error) throw error;
    return { ...row, ...metadata };
  });
}

export { redis };
