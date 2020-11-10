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
