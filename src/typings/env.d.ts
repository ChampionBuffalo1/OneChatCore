declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: 'production' | 'development';
      JWT_SECRET: string;
      DATABASE_URL: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_SECRET: string;
      LOKI_AUTH?: string;
      GRAFANA_IP?: string;
    }
  }
}

export {};
