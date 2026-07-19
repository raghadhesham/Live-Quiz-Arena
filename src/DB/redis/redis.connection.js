// maynfa3sh nkhazen fe RAM 3shan its size is small
// so ? store data you access frequently in Remote Dictionary Server (Redis DB => IN-MEMORY ,KEY VALUE NO SQL DB)

import { createClient } from "redis";
import { config } from "../config/configServices.js";
// import { REDIS_URL } from "../config/configServices.js";
export const redisClient = createClient({
  url: config.redis.redis_url,
});

redisClient.on("error", function (err) {
  console.log(err.message,err.stack);
  
  throw err;
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("redis connected");
  } catch (error) {
    console.log("redis failed to connect", error);
  }
};
