declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_PORT: string;
      NODE_ENV: 'production' | 'development';
      JWT_SECRET: string;
      REDIS_URL: string;
      MONGO_URL: string;
      MONGO_DB_NAME: string;
    }
  }
}

export {};
