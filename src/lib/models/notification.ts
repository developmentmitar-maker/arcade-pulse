import mongoose, { Schema, type Document } from 'mongoose';

export interface INotification extends Document {
  email: string;
  snapshotId: mongoose.Types.ObjectId;
  changeType: string;
  previousValue: string;
  currentValue: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'Snapshot',
      required: true,
    },
    changeType: {
      type: String,
      required: true,
    },
    previousValue: {
      type: String,
      default: '',
    },
    currentValue: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

NotificationSchema.index({ sentAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
