import { Express } from "express";
import { Payload } from "../api/middlewares";

declare global {
  namespace Express {
    interface Request {
      payload: Payload
    }
  }
}
