import mongoose, { Document, Schema } from 'mongoose';

export interface IGuild extends Document {
  id: string;
  settings: {
    prefix: string;
  };
}

const GuildSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  settings: {
    prefix: {
      type: String,
      required: true,
      default: 'c!'
    }
  }
});

export default mongoose.model<IGuild>('Guild', GuildSchema);
