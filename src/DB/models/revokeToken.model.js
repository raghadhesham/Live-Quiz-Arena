import mongoose from "mongoose";

export const revokeTokenSchema = new mongoose.Schema({
  expiresAt: {
    type: Date,
    required: true,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  tokenId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
});
revokeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// expireAfterSeconds btms7 eldocument b3d el seconds elly ana 7taha tekhlas, say expiresAt youm elkhamees elsa3a 2 fa elkhamees elsa3a 2 after 0 seconds it must expire
export const revokeTokenModel = mongoose.model(
  "revokeToken",
  revokeTokenSchema,
);
