import mongoose, { Document, Schema } from 'mongoose';

export interface IGuild extends Document {
  id: string;
  settings: {
    prefix: string;
    channels?: {
      starboard?: string;
    };
  };
  stats: {
    [key: string]: number;
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
    },
    channels: {
      starboard: {
        type: String
      }
    }
  },
  stats: Schema.Types.Mixed
});

export default mongoose.model<IGuild>('Guild', GuildSchema);
