declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: 'production' | 'development';
      JWT_SECRET: string;
      DATABASE_URL: string;
    }
  }
}

export {};
