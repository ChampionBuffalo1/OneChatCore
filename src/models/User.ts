import { IUser } from '../typings/models';
import { BaseModel } from './BaseModel';
import { COLLECTION_NAME } from '../Constants';

const collectionName = COLLECTION_NAME.USER;

BaseModel.registerCollection(collectionName);

export default class User extends BaseModel<IUser> {
  constructor(private data: IUser) {
    super(collectionName);
  }

  static findOne = (query: Partial<IUser>, projection?: string) =>
    BaseModel._findOne(collectionName, query, projection);

  static findMany = (query: Partial<IUser>[], projection?: string) =>
    BaseModel._findMany(collectionName, query, projection);

  static insertOne = (query: IUser) => BaseModel._insertOne(collectionName, query);

  static insertMany = (query: IUser[]) => {
    BaseModel._insertMany(collectionName, query);
  };

  static exists = async (query: Partial<IUser>): Promise<boolean> => !!(await User.findOne(query, '_id'));

  save() {
    super._save(this.data);
  }
}
