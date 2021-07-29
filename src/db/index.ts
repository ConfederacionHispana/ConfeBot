import mongoose from 'mongoose';
import { env } from '#lib/env';

import User from './models/User';
import Vigilancia from './models/Vigilancia';

mongoose.connect(env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

export default {
  User,
  Vigilancia
};
