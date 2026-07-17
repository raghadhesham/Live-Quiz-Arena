import { config } from "../../../config/configServices.js";

export const errorHandler = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  return res.status(status).json({
    error_message:
      status == 500
        ? "something went wrong"
        : (error.message ?? "something went wrong"),
    stack: config.env == "DEVELOPMENT" ? error.stack : undefined,
  });
};
export const Error = ({
  message = "fail",
  status = 400,
  extra = undefined,
} = {}) => {
  throw new Error(message, { cause: { status, extra } });
};
export const ConflictException = ({ message = "Conflict", extra } = {}) => {
  throw new Error(message, { cause: { status: 409, extra } });
};
export const NotFoundException = ({ message = "Notfound", extra } = {}) => {
  throw new Error(message, { cause: { status: 404, extra } });
};
