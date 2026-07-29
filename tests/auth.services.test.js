import test from "node:test";
import assert from "node:assert/strict";

import { login } from "../src/modules/Auth/auth.services.js";
import {
  deleteRedisValue,
  getRedisValue,
  setRedisValue,
} from "../src/DB/redis/redis.services.js";

test("login increments the retry counter when a prior attempt exists", async () => {
  const email = "test@example.com";
  const counterKey = `user::${email}`;
  await setRedisValue({ key: counterKey, value: 1 });

  const req = {
    body: {
      email,
      password: "wrong-password",
    },
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  try {
    await login(req, res);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: "wrong credentials" });
    assert.equal(await getRedisValue(counterKey), 2);
  } finally {
    await deleteRedisValue(counterKey);
  }
});
