import { EventEmitter } from "node:events";
import { emailEnum } from "../enums/email.enum.js";
export const eventEmitter = new EventEmitter();

eventEmitter.on(emailEnum.confirmEmail, async (func) => {
  await func();
});
