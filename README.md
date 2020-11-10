# mongoose-dataloader-generator

Abstract class that provided properly typed interfaces in order to create Dataloaders in one shot.

Takes an array of mongoose models `(mongoose.Model)[]` and creates dataloaders for each model. \*see examples.

## Install

```
npm i mongoose-dataloader-generator
```

or

```
yarn add mongoose-dataloader-generator
```

## Example Use

#### Models and Document Interfaces

```ts
//interfaces.ts
import mongoose, { Document, Schema } from 'mongoose'
export interface UserDocument extends Document {
  email: string
  password: string
  name: string
}

export const User = mongoose.model<UserDocument>(
  'User',
  new Schema<UserDocument>({
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    name: String,
  })
)

export interface SurveyDocument extends Document {
  name: string
  user: UserDocument
  questions: SurveyQuestionDocument[]
}

export const Survey = mongoose.model<SurveyDocument>(
  'Survey',
  new Schema<SurveyDocument>({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
    questions: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion' },
    ],
  })
)

export interface SurveyQuestionDocument extends Document {
  survey: SurveyDocument
  title: string
  options: string[]
  answers: string[]
}
export const SurveyQuestion = mongoose.model<SurveyQuestionDocument>(
  'SurveyQuestion',
  new Schema<SurveyQuestionDocument>({
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
    },
    title: String,
    options: [String],
    answers: [String],
  })
)
```

#### Example Class (MongooseLoader)

```ts
//MongooseLoader.ts
import MongooseLoaderGenerator, {
  LoaderRecorType,
  GenericLoaders,
  GenericModels,
} from 'mongoose-dataloader-generator'
import {
  Survey,
  User,
  SurveyQuestion,
  SurveyDocument,
  UserDocument,
  SurveyQuestionDocument,
} from './interfaces'

// Create a type with the Interfaces you want to support
type DocumentTypes = [SurveyDocument, UserDocument, SurveyQuestionDocument] // You can add as many as you want here.

//Create Loaders, Models and RecordType Using the Generic Helpers
type MyLoaders = GenericLoaders<DocumentTypes>
type Models = GenericModels<DocumentTypes>
interface RecordType extends LoaderRecorType<DocumentTypes> {
  surveyLoader: MyLoaders[0]
  userLoader: MyLoaders[1]
  surveyQuestionLoader: MyLoaders[2]
  //...other here//
}

const MODELS: Models = [Survey, User, SurveyQuestion] //Array descrived by Models type. (add more here if needed)

//Extend the Generator class and pass the models to the constructor.
export class MongooseLoader extends MongooseLoaderGenerator<
  DocumentTypes,
  RecordType
> {
  constructor() {
    super(MODELS)
  }
  //Implement initialize.
  // It should set all the loaders by calling the method `createLoaders`.
  async initialize() {
    const [
      surveyLoader,
      userLoader,
      surveyQuestionLoader,
    ] = this.createLoaders()
    this.loaders.surveyLoader = surveyLoader
    this.loaders.userLoader = userLoader
    this.loaders.surveyQuestionLoader = surveyQuestionLoader
    return this.loaders
  }
}
```

#### Express Middleware Example

```ts
import express, { Request } from 'express'
import { WIthLoaderRequest } from 'mongoose-dataloader-generator'
import { MongooseLoader } from './MongooseLoader'

const app = express()
const loader = new MongooseLoader()
//by default will attach the loader property to the request.
app.use(loader.expressMiddleware)

// Request properly typed.
export interface MyRequest<
  P = Request['params'],
  ResBody = any,
  ReqBody = any,
  ReqQuery = Request['query']
> extends WIthLoaderRequest<MongooseLoader, P, ResBody, ReqBody, ReqQuery> {}

app.get('/user/:id', async (req: MyRequest<{ id: string }>, res) => {
  const { id } = req.params
  const user = await req.loader!.loaders.userLoader.load(id)
  res.json(user)
})
```
