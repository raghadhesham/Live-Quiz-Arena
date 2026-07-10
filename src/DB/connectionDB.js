import mongoose from "mongoose";
import { config } from "./config/configServices.js";

const URI = config.db.uri;

export const checkConnectionDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log("connected to the database");
  } catch (error) {
    console.log("failed", error);
  }
};
