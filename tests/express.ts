import express, { Request } from 'express'
import { WIthLoaderRequest } from '../src/index'
import { MongooseLoader } from './MongooseLoader.test'
// Express and Express Middleware
const app = express()
const loader = new MongooseLoader()
app.use(loader.expressMiddleware)

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
