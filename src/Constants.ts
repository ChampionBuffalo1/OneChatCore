/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const isProd: boolean = process.env.NODE_ENV === "production";
export const stableApiVersion = 1;
export const cookieSecret: string = process.env.COOKIE_SECRET!;
export const cookieName: string = process.env.COOKIE_NAME || "protid";
export const databaseName: string = process.env.MONGO_DB_NAME || "pwdata";
export const maxCookieAge: number = 1000 * 60 * 60 * 24; // 24 hrs

export const maxPassLen = 30;
export const maxRetries = 10;
export const bcrpytSaltRounds = 8;
export const redisURL: string = process.env.REDIS_URL!;
export const mongoURL: string = process.env.MONGO_URL!;
export const PORT: number = +process.env.API_PORT! || 3001;
export const redirectUriKey = "redirect";
// MongoDB Collection name

// const enum will replace all instance of enum with the variable name at compile time
export const enum COLLECTION_NAME {
  USER = "user",
  MESSAGE = "message",
  GROUP_INFO = "group",
}

// Max delay time for reconnecting to redis & mongo client (in ms)
export const defaultDelay: number = 1000 * 60 * 10;
export const MINUTE: number = 1000 * 60 * 60;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const enum ERROR_CODES {
  INVALID_CRED = 17,
  INCOMPLETE_FORM,
  INVALID_USERNAME,
  ALREADY_LOGGEDIN,
  USER_DOESNT_EXISTS,
  USERNAME_ALREADY_TAKEN,
}

export const enum HttpCodes {
  OK = 200,
  // Invalid argument
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  // Permission denied (e.g. Invalid API Key)
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PAYLOAD_TOO_LARGE = 413,
  TOO_MANY_REQS = 429,
  INTERNAL_ERROR = 500,
  NOT_IMPLEMENTED = 501,
}
