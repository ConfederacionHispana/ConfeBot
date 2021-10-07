import mongoose from 'mongoose';

export interface IVigilancia extends mongoose.Document {
  interwiki: string;
  lastCheck?: number;
}

const VigilanciaSchema: mongoose.Schema = new mongoose.Schema( {
  interwiki: { type: String, required: true },
  lastCheck: { type: Number }
} );

export default mongoose.model<IVigilancia>( 'Vigilancia', VigilanciaSchema );
