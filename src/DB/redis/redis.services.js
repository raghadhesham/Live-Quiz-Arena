import { redisClient } from "./redis.connection.js";

export const setRedisValue = async ({ key, value, ttl }) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl }) // set expects a string
      : await redisClient.set(key, data); 
  } catch (error) {
    console.log("error setting the key", error);
  }
};
export const getRedisValue = async (key) => {
  try {
    try {
      // console.log(JSON.parse(await redisClient.get(key)));
      return JSON.parse(await redisClient.get(key));
    } catch (error) {
      return await redisClient.get("error hena",key);
    }
  } catch (error) {
    console.log("error getting the key", error);
  }
};
export const mGetRedisValue = async (keys) => {
  try {
    try {
      if (keys.length == 0) {
        return 0;
      }
      // console.log(JSON.parse(await redisClient.mGet(keys)));
      return JSON.parse(await redisClient.mGet(keys));
    } catch (error) {
      await redisClient.get(keys);
    }
  } catch (error) {
    console.log("error multi getting the keys", error);
  }
};
export const updateRedisValue = async ({ key, value, ttl }) => {
  try {
    const exists = await redisValueExists(key);
    if (!exists) {
      return 0;
    }
    return await setRedisValue({ key, value, ttl });
  } catch (error) {
    console.log("error updating the key", error);
  }
};
export const deleteRedisValue = async (key) => {
  try {
    const exists = await redisValueExists(key);
    if (!exists) {
      return 0; 
    }
    if (key.length == 0) {
      return 0;
    }
    return await redisClient.del(key);
  } catch (error) {
    console.log("error in delete");
  }
};
export const redisValueExists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log("error in redisValueExists", error);
  }
};
export const redisValueExpire = async (key, ttl) => {
  try {
    await redisClient.expire(key, ttl);
  } catch (error) {
    console.log("error in expire", error);
  }
};
export const redisValuettl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("error in expire", error);
  }
};
export const rediskeys = async (prefix) => {
  try {
    return await redisClient.keys(`${prefix}*`);
  } catch (error) {
    console.log("error in keys with prefix", error);
  }
};
export const incrementRedisValue = async (key) => {
  try {
    return await redisClient.incr(key)
  } catch (error) {
    throw new Error("Couldn't increment key");
    
  }
}
export const otp_key = (email, subject) => {
  return `otp::${email}::${subject}`;
}
export const ban_key = (email) => {
  return `banned::${ otp_key(email)}`;
}