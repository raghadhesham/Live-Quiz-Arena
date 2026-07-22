import { hash, compare } from "bcrypt";
import { roleEnum } from "../../common/utils/enums/user.enum.js";
import { findOne } from "../../DB/repository/database.repository.js";
import {
  createTokenPayload,
  generateAccessToken,
  generateRefreshToken,
} from "../../common/utils/auth/token.js";
import { userModel } from "../../DB/models/user.model.js";
import { eventEmitter } from "../../common/utils/email/email.event.js";
import { emailEnum } from "../../common/utils/enums/email.enum.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import {
  deleteRedisValue,
  getRedisValue,
  setRedisValue,
} from "../../DB/redis/redis.services.js";
const sendOTP = async (email, subject) => {
  const OTP = await generateOTP();
  await sendEmail({
    from: config.email.email,
    to: email,
    subject: "Hi! this is nodemailer working",
    html: emailTemplate(OTP),
  });
  setRedisValue({
    key: otp_key(email, subject),
    value: await hash(OTP.toString(), 10),
    ttl: 15 * 60,
  });
};
const verifyOTP = async (email, gotOTP, subject) => {
  try {
    if (!gotOTP) {
      throw new Error("invalid credentials");
    }
    console.log(otp_key(email, subject));
    const OTPExists = await getRedisValue(otp_key(email, subject));
    if (!OTPExists) {
      throw new Error("OTP not found or expired");
    }
    if (!(await compare(gotOTP, OTPExists))) {
      throw new Error("Invalid OTP (does not match)");
    }
  } catch (error) {
    console.log(error, error.stack, error.message);
  }
};

export const signUp = async (req, res) => {
  let {
    fullName,
    email,
    password,
    cpassword,
    gender,
    age,
    phone, 
    bio,
    DOB,
    role,
  } = req.body;
  const hashed = await hash(password, 12); 
  let paths = [];
  // if (req.files.album) {
  //   for (let i = 0; i < req.files.album.length; i++) {
  //     paths.push(`${req.protocol}://${req.host}/${req.files.album[i].path}`);
  //   }
  // }
  const emailExists = await findOne({
    model: userModel,
    filter: { email },
  });
  if (emailExists) {
    throw new Error("conflict");
  }
  if (role == "host") {
    role = roleEnum.host;
  } else {
    role = roleEnum.candidate;
  }
  const user = await userModel.create({
    fullName,
    email,
    password: hashed,
    gender,
    age,
    phone,
    album: paths.length > 0 ? paths : ["default.png"],
    bio,
    DOB,
    role,
  });
  eventEmitter.emit(emailEnum.confirmEmail, async () => {
    sendOTP(email, "Signup");
  });
  return successResponse({ res, status: 201, data: { user } });
};
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    let counterKey = `user::${email}`;
    let banKey = `user::banned::${email}`;
    let user = await findOne({
      model: userModel,
      filter: { email },
    });
    console.log(user);
    if (!user) {
      res.status(401).json({ message: "Wrong Credentials" });
      throw new Error("Wrong Credentials");
    }
    if (await getRedisValue(banKey)) {
      throw new Error(
        "You have exceeded the number of trials to enter your correct credentials. You are blocked",
      );
    }
    if (user) {
      const isMatched = await compare(password, user.password);
      console.log(user.password);

      if (isMatched) {
        const payload = createTokenPayload(user);
        const refresh_token = generateRefreshToken(payload);
        const access_token = generateAccessToken(payload);
        let { istwoStepVerificationEnabled } = user;
        console.log(istwoStepVerificationEnabled);
        if (istwoStepVerificationEnabled == true) {
          let { gotOTP } = req.body;

          if (!gotOTP) {
            // First time: send OTP
            await sendOTP(email, "twoStep");
            return res.status(200).json({
              message:
                "OTP has been sent to your email. Please provide it to complete login",
            });
          }
          await sendOTP(email, "twoStep");
          await verifyOTP(email, gotOTP, "twoStep");
          return successResponse({
            res,
            message: "Valid credentials, OTP verified successfully",
            data: {
              access_token,
              refresh_token,
              user: {
                id: user._id,
                email: user.email,
                role: user.role,
              },
            },
          });
        }
        return successResponse({
          res,
          message: "welcome to our app",
          data: {
            access_token,
            refresh_token,
            user: {
              id: user._id,
              email: user.email,
              role: user.role,
            },
          },
        });
      } else {
        res.status(400).json({ message: "wrong credentials" });
        if (await getRedisValue(counterKey)) {
          await incrementRedisValue(counterKey);
          if ((await getRedisValue(counterKey)) == 5) {
            await setRedisValue({
              key: banKey,
              value: true,
              ttl: 1 * 60,
            });
            await deleteRedisValue(counterKey);
            throw new Error(
              `You have exceeded the limit of trials, try again after ${await redisValuettl(banKey)} seconds`,
            );
          }
        } else {
          await setRedisValue({
            key: counterKey,
            value: 1,
          });
        }
      }
    }
    console.log(istwoStepVerificationEnabled);
    throw new Error("Something went wrong");
  } catch (error) {
    console.log(error.message, error.stack);
  }
};
export const confirmEmail = async (req, res) => {
  const { gotOTP, email, subject } = req.body;
  verifyOTP(email, gotOTP, subject);
  await updateOne({
    model: userModel,
    filter: { email, confirmed: false },
    update: { confirmed: true, confirmEmail: new Date() },
  });
  await deleteRedisValue(otp_key(email));
  return successResponse({ res, message: `confirmed` });
};
