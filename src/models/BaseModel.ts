import { DbInstance } from '../lib';
import type { Nullable } from '../typings';
import type { WithId, Document, FindCursor, Collection, InsertManyResult, InsertOneResult } from 'mongodb';

export class BaseModel<T extends Record<string, unknown>> {
  protected static colMap: Map<string, Collection | undefined> = new Map();

  public static registerCollection(col_name: string) {
    BaseModel.colMap.set(col_name, DbInstance?.collection(col_name));
  }

  constructor(private col_name: string) {}
  protected static _insertOne = <T extends Record<string, unknown>>(
    colName: string,
    data: T
  ): Promise<InsertOneResult<Document>> => {
    let col = BaseModel.colMap.get(colName);
    if (!col) {
      BaseModel.registerCollection(colName);
      col = BaseModel.colMap.get(colName);
      if (!col) {
        throw new Error(`"${colName}" collection not found.`);
      }
    }
    return col.insertOne(data);
  };

  protected static _insertMany = <T extends Record<string, unknown>>(
    colName: string,
    data: T[]
  ): Promise<InsertManyResult<Document>> => {
    let col = BaseModel.colMap.get(colName);
    if (!col) {
      BaseModel.registerCollection(colName);
      col = BaseModel.colMap.get(colName);
      if (!col) {
        throw new Error(`"${colName}" collection not found.`);
      }
    }
    return col.insertMany(data);
  };

  protected static _findOne = <T extends Record<string, unknown>>(
    colName: string,
    query: T,
    projection?: string
  ): Promise<Nullable<WithId<Document>>> => {
    let col = BaseModel.colMap.get(colName);
    if (!col) {
      BaseModel.registerCollection(colName);
      col = BaseModel.colMap.get(colName);
      if (!col) {
        throw new Error(`"${colName}" collection not found.`);
      }
    }
    return col.findOne(query, {
      projection: getProjectionObject(projection)
    });
  };

  protected static _findMany = <T extends Record<string, unknown>>(
    colName: string,
    query: T[],
    projection?: string
  ): FindCursor<WithId<Document>> => {
    let col = BaseModel.colMap.get(colName);
    if (!col) {
      BaseModel.registerCollection(colName);
      col = BaseModel.colMap.get(colName);
      if (!col) {
        throw new Error(`"${colName}" collection not found.`);
      }
    }
    return col.find(query, {
      projection: getProjectionObject(projection)
    });
  };

  protected static _exists = <T extends Record<string, unknown>>(colName: string, query: T): boolean =>
    !!BaseModel._findOne(colName, query, '_id');

  protected _save(data: T): Promise<InsertOneResult<Document>> {
    return BaseModel._insertOne(this.col_name, data);
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
