import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id: string,
  fandomUser: {
    username: string,
    userId: number,
    verifiedAt: Date
  },
  serverEvents: {
    date: Date,
    event: string,
  }[],
  fandomAccountEvents: {
    date: Date,
    event: string,
    account: {
      username: string,
      userId: number
    }
  }[]
}

const UserSchema: Schema = new Schema({
  id: {
    type: String,
    required: true
  },
  fandomUser: {
    username: {
      type: String,
      required: true
    },
    userId: {
      type: Number,
      required: true
    },
    verifiedAt: {
      type: Date,
      required: true
    }
  },
  serverEvents: [{
    date: Date,
    event: String
  }],
  fandomAccountEvents: [{
    date: Date,
    event: String,
    account: {
      username: String,
      userId: Number
    }
  }]
});

export default mongoose.model<IUser>('User', UserSchema);
