import { ObjectId } from 'mongodb';

export type mongoId = {
  _id?: string | ObjectId;
};

export type IUser = mongoId & {
  username: string;
  passwordHash: string;
};
