import mongoose from 'mongoose';
import { env, loadEnv } from '../environment';

import Vigilancia from './Vigilancia';

loadEnv();

mongoose.connect(env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

export default {
  Vigilancia
};
