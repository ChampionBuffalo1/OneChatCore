export const isProd: boolean = process.env.NODE_ENV === 'production';
export const noConsole: boolean = !!process.env.NO_CONSOLE;
export const JwtSecret: string = process.env.JWT_SECRET || 'secret';
export const maxTokenAge: number = 1000 * 60 * 60 * 24 * 7; // 7 days

export const maxPassLen = 60;
export const maxRetries = 6; // Inclusive
export const maxWsCon = 1000;
export const bcryptSaltRounds = 8;
export const PORT: number =
  process.env.PORT && !Number.isNaN(+process.env.PORT) ? parseInt(process.env.PORT, 10) : 3000;
export const RESULT_PER_PAGE = 10;
export const CLOUDINARY_FOLDER_NAME = 'onechat';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};
