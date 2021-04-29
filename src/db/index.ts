import mongoose from 'mongoose';
import { env } from '../environment';

import Vigilancia from './models/Vigilancia';

mongoose.connect(env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

export default {
  Vigilancia
};
