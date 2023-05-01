import { TMessage } from '../typings/models';
import { BaseModel } from './BaseModel';
import { COLLECTION_NAME } from '../Constants';
import { DeleteOptions, Filter, UpdateOptions } from 'mongodb';

const collectionName = COLLECTION_NAME.MESSAGE;

export default class Message extends BaseModel<TMessage> {
  constructor(private data: TMessage) {
    super(collectionName);
  }

  static findOne = (query: Partial<TMessage>, projection?: string) =>
    BaseModel._findOne(collectionName, query, projection);

  static findMany = (query: Partial<TMessage>[], projection?: string) =>
    BaseModel._findMany(collectionName, query, projection);

  static insertOne = (query: TMessage) => BaseModel._insertOne(collectionName, query);

  static insertMany = (query: TMessage[]) => BaseModel._insertMany(collectionName, query);

  static updateOne = (query: Filter<TMessage>, update: Partial<TMessage>, opts?: UpdateOptions) =>
    BaseModel._updateOne(collectionName, query, update, opts);

  static updateMany = (query: Filter<TMessage>, update: Partial<TMessage>, opts?: UpdateOptions) =>
    BaseModel._updateMany(collectionName, query, update, opts);

  static deleteOne = (query: Filter<TMessage>, opts?: DeleteOptions) =>
    BaseModel._deleteOne(collectionName, query, opts);

  static deleteMany = (query: Filter<TMessage>, opts?: DeleteOptions) =>
    BaseModel._deleteMany(collectionName, query, opts);

  static exists = async (query: Partial<TMessage>): Promise<boolean> => !!(await Message.findOne(query, '_id'));

  save() {
    super._save(this.data);
  }
}
