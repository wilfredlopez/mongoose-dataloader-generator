import MongooseLoaderGenerator, {
  LoaderRecorType,
  GenericLoaders,
  GenericModels,
} from "../src/index";
// Example Interfaces that extend mongosee.Document
//Example Mongosee Models
import {
  Survey,
  User,
  SurveyQuestion,
  SurveyDocument,
  UserDocument,
  SurveyQuestionDocument,
} from "./interfaces"; //*See example interfaces and models

// Create a type with the Interfaces you want to support
type DocumentTypes = [SurveyDocument, UserDocument, SurveyQuestionDocument];

//Create Loaders, Models and RecordType Using the Generic Helpers
type MyLoaders = GenericLoaders<DocumentTypes>;
type Models = GenericModels<DocumentTypes>;
interface RecordType extends LoaderRecorType<DocumentTypes> {
  surveyLoader: MyLoaders[0];
  userLoader: MyLoaders[1];
  surveyQuestionLoader: MyLoaders[2];
  //...other here//
}

const MODELS: Models = [Survey, User, SurveyQuestion]; //Array descrived by Models type.

//Extend the Genetarot and pass the models to the constructor.
export class MongooseLoader extends MongooseLoaderGenerator<
  DocumentTypes,
  RecordType
> {
  constructor() {
    super(MODELS);
  }
  //Implement initialize.
  // It should set all the loaders by calling the method `createLoaders`.
  async initialize() {
    const [
      surveyLoader,
      userLoader,
      surveyQuestionLoader,
    ] = this.createLoaders();
    this.loaders.surveyLoader = surveyLoader;
    this.loaders.userLoader = userLoader;
    this.loaders.surveyQuestionLoader = surveyQuestionLoader;
    return this.loaders;
  }
}

describe("Loader Class", () => {
  it("has properties", () => {
    const loader = new MongooseLoader();

    expect(loader.loaders).not.toBeUndefined();
  });
});
