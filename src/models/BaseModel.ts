import { DbInstance } from '../lib';
import type { Nullable } from '../typings';
import type {
  WithId,
  Document,
  FindCursor,
  Collection,
  UpdateResult,
  UpdateOptions,
  InsertManyResult,
  InsertOneResult
} from 'mongodb';

const colMap: Map<string, Collection> = new Map();

export class BaseModel<T extends Record<string, unknown>> {
  public static registerCollection(col_name: string): Collection {
    if (!DbInstance) throw new Error('DbInstance is not initialized');
    const collection = DbInstance.collection(col_name);
    colMap.set(col_name, collection);
    return collection;
  }

  constructor(private col_name: string) {}
  protected static _insertOne = <T extends Record<string, unknown>>(
    colName: string,
    data: T
  ): Promise<InsertOneResult<Document>> => BaseModel.getCollection(colName).insertOne(data);

  protected static _insertMany = <T extends Record<string, unknown>>(
    colName: string,
    data: T[]
  ): Promise<InsertManyResult<Document>> => BaseModel.getCollection(colName).insertMany(data);

  protected static _findOne = <T extends Record<string, unknown>>(
    colName: string,
    query: T,
    projection?: string
  ): Promise<Nullable<WithId<Document>>> =>
    BaseModel.getCollection(colName).findOne(query, {
      projection: getProjectionObject(projection)
    });

  protected static _findMany = <T extends Record<string, unknown>>(
    colName: string,
    query: T[],
    projection?: string
  ): FindCursor<WithId<Document>> =>
    BaseModel.getCollection(colName).find(query, {
      projection: getProjectionObject(projection)
    });

  protected static _updateOne = <T extends Record<string, unknown>>(
    colName: string,
    query: T,
    update: T,
    opts?: UpdateOptions
  ): Promise<UpdateResult> => BaseModel.getCollection(colName).updateOne(query, update, opts);
  protected static _updateMany = <T extends Record<string, unknown>>(
    colName: string,
    query: T,
    update: T,
    opts?: UpdateOptions
  ): Promise<UpdateResult> => BaseModel.getCollection(colName).updateMany(query, update, opts);

  protected static _exists = <T extends Record<string, unknown>>(colName: string, query: T): boolean =>
    !!BaseModel._findOne(colName, query, '_id');

  protected _save(data: T): Promise<InsertOneResult<Document>> {
    return BaseModel._insertOne(this.col_name, data);
  }
  private static getCollection(colName: string): Collection {
    let col = colMap.get(colName);
    if (!col) col = BaseModel.registerCollection(colName);
    return col;
  }
}

function getProjectionObject(projection?: string) {
  const proj: Record<string, true> = {};
  projection
    ?.split(' ')
    .map(k => k.trim())
    .forEach(k => {
      proj[k] = true;
    });
  return proj;
}
