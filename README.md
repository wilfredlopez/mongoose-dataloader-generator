# mongoose-dataloader-generator

### Takes a mongoose.Model array and creates dataloaders for each model.

```ts
import MongooseLoaderGenerator, {
  LoaderRecorType,
  GenericLoaders,
  GenericModels,
} from 'mongoose-dataloader-generator'
// Example Interfaces that extend mongosee.Document
import { UserModel, SurveyModel, SurveyQuestionModel } from '../interfaces'
//Example Mongosee Models
import { Survey, User, SurveyQuestion } from '../db'

// Create a type with the Interfaces you want to support
type DocumentTypes = [SurveyModel, UserModel, SurveyQuestionModel]

//Create Loaders, Models and RecordType Using the Generic Helpers
type MyLoaders = GenericLoaders<DocumentTypes>
type Models = GenericModels<DocumentTypes>
interface RecordType extends LoaderRecorType<DocumentTypes> {
  surveyLoader: MyLoaders[0]
  userLoader: MyLoaders[1]
  surveyQuestionLoader: MyLoaders[2]
  //...other here//
}

const MODELS: Models = [Survey, User, SurveyQuestion] //Array descrived by Models type.

//Extend the Genetarot and pass the models to the constructor.
export class Load extends MongooseLoaderGenerator<DocumentTypes, RecordType> {
  constructor() {
    super(MODELS)
  }
  //Implement initialize.
  // It should set all the loaders by calling the method `createLoaders`.
  async initialize() {
    const loaders = this.createLoaders()
    this.loaders.surveyLoader = loaders[0]
    this.loaders.userLoader = loaders[1]
    this.loaders.surveyQuestionLoader = loaders[2]
    return this.loaders
  }
}
```

### Add Express Middleware to attach to request object

```ts
export async function dataloaderMiddleware(req: any, _res: any, next: any) {
  const myDataloader = new Load()
  await myDataloader.initialize() // wait for the initialize function to run.
  req.dataloader = myDataloader
  next()
}
```

### Example Use

```ts
import { Request, Response, Router } from 'express'
import MyRequest from '../interfaces/index'
import { Load } from '../load'

export default interface MyRequest extends Request {
  userId?: string
  email?: string
  myDataloader?: Load
}

const router = Router()

router.get('/:id', ensureAdmin, async (req: MyRequest, res: Response) => {
  const user = await req.myDataloader!.loaders.userLoader.load(req.params.id)
  res.json(user)
})

export const UserController = router
```
