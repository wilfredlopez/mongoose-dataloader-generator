// TO CREATE NPM Library
import DataLoader from 'dataloader'
import { Document, FilterQuery, Model } from 'mongoose'
import { Request, NextFunction, Response } from 'express'

export interface WIthLoaderRequest<
  T extends {},
  P = Request['params'],
  ResBody = any,
  ReqBody = any,
  ReqQuery = Request['query']
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  loader?: T
}

export type GenericLoader<T> = DataLoader<string, T, string>

export type GenericModels<T extends Document[]> = {
  readonly [K in keyof T]: T[K] extends Document ? Model<T[K], {}> : never
}

export type GenericLoaders<T extends Document[]> = {
  [K in keyof T]: GenericLoader<T[K]>
}

export interface WithIds {
  _id: string
}
export type IdArray = WithIds['_id'][]

export interface LoaderRecorType<
  T extends Document[],
  R extends GenericLoaders<T> = GenericLoaders<T>
> {
  [k: string]: R[number]
}

/**
 * Takes a mongoose.Model array and creates dataloaders for each model.
 * @example
 * import MongooseLoaderGenerator, { LoaderRecorType, GenericLoaders, GenericModels } from 'mongoose-dataloader-generator'
 * import { User, Survey, SurveyQuestion } from '../interfaces'
 * //Mongosee Models
 * import { surveysDB, userDb, SurveyQuestionDB } from '../db'
import { WIthLoaderRequest } from '../tests/generator.test'
 *
 *
 * type DocumentTypes = [Survey, User, SurveyQuestion]
 * type MyLoaders = GenericLoaders<DocumentTypes>
 * type Models = GenericModels<DocumentTypes>
 * interface RecordType extends LoaderRecorType<DocumentTypes> {
 *   surveyLoader: MyLoaders[0]
 *   userLoader: MyLoaders[1]
 *   surveyQuestionLoader: MyLoaders[2]
 * }
 *
 * const MODELS:Models = [surveysDB, userDb, SurveyQuestionDB]
 *
 * export class Load extends MongooseLoaderGenerator<DocumentTypes, RecordType> {
 *   constructor() {
 *     super(MODELS)
 *   }
 *   async initialize() {
 *     const loaders = this.createLoaders()
 *     this.loaders.surveyLoader = loaders[0]
 *     this.loaders.userLoader = loaders[1]
 *     this.loaders.surveyQuestionLoader = loaders[2]
 *     return this.loaders
 *   }
 * }
 *
 * @example
 * // Express Middleware to attach to request object
 * export async function dataloaderMiddleware(req: any, _res: any, next: any) {
 *   const myDataloader = new Load()
 *   await myDataloader.initialize() // wait for the initialize function to run.
 *   req.dataloader = myDataloader
 *   //Example use
 *   const user = await myDataloader.loaders.userLoader.load('userid')
 *   console.log(user)
 *   next()
 * }
 */
export default abstract class MongooseLoaderGenerator<
  MongooseDocumentType extends Document[],
  LoadersType extends LoaderRecorType<MongooseDocumentType>,
  ModelsType extends readonly Model<any, {}>[] = GenericModels<
    MongooseDocumentType
  >
> {
  private MODELS: ModelsType
  loaders: LoadersType
  /**
   * @param { Array } models Readonly Mongoose Model Array `mongoose.Model<any, {}>[]`
   */
  constructor(models: ModelsType) {
    this.MODELS = models
    this.loaders = {} as any
  }
  /**
   * This Method should set all the loaders by calling the method `createLoaders`.
   * @example
   *     const loaders = this.createLoaders() // returns a readonly array of the loaders
   *     this.loaders.surveyLoader = loaders[0]
   *     this.loaders.userLoader = loaders[1]
   *     this.loaders.surveyQuestionLoader = loaders[2]
   *     return this.loaders
   */
  abstract initialize(): Promise<LoadersType>
  private createMap<T extends WithIds>(entities: T[]) {
    const mapObject: { [key: string]: T } = {}

    for (let entity of entities) {
      mapObject[entity._id] = entity
    }
    return mapObject
  }
  private mapIds<T extends WithIds>(
    ids: IdArray,
    mapObject: {
      [key: string]: T
    }
  ) {
    return ids.map(id => mapObject[id])
  }
  private generateBatch<T extends WithIds>(array: T[], ids: IdArray) {
    const userMap = this.createMap(array)
    return this.mapIds(ids, userMap)
  }

  private async batchGeneric<Entity extends Document>(
    model: Model<Entity, {}>,
    ids: IdArray
  ) {
    const query: FilterQuery<{}> = {
      _id: {
        $in: ids,
      },
    }
    const entities = await model.find(query)
    return this.generateBatch(entities, ids)
  }

  protected createLoaders() {
    const output: GenericLoader<any>[] = [] as any

    for (let loader of this.MODELS) {
      output.push(this.createLoader(loader as any))
    }

    return output as GenericLoaders<MongooseDocumentType>
  }

  private createLoader<DocType extends Document>(MongoModel: Model<DocType>) {
    const loader = new DataLoader<string, DocType>(keys => {
      return this.batchGeneric(MongoModel, keys as IdArray)
    })

    return loader
  }

  async expressMiddleware<T extends WIthLoaderRequest<this>>(
    req: T,
    _res: Response,
    next: NextFunction
  ) {
    await this.initialize()
    req.loader = this
    next()
  }
}
