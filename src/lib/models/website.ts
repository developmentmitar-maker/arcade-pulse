import mongoose, { Schema, type Document } from 'mongoose';

export interface IWebsite extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  url: string;
  createdAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

WebsiteSchema.index({ owner: 1 });

export default mongoose.models.Website ||
  mongoose.model<IWebsite>('Website', WebsiteSchema);
