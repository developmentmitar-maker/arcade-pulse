import mongoose, { Schema, type Document } from 'mongoose';
import type { WebsiteId, SectionData, ChangeDetail } from '@/types';

export interface ISnapshot extends Document {
  website: WebsiteId;
  sections: SectionData;
  checkedAt: Date;
  hasChanges: boolean;
  changes: ChangeDetail[];
}

const ChangeDetailSchema = new Schema<ChangeDetail>(
  {
    section: {
      type: String,
      required: true,
      enum: ['games', 'bonus', 'announcements'],
    },
    previousValue: { type: String, default: '' },
    currentValue: { type: String, default: '' },
  },
  { _id: false }
);

const SnapshotSchema = new Schema<ISnapshot>(
  {
    website: {
      type: String,
      required: true,
      enum: ['arcade-portal', 'facilitator-portal'],
      index: true,
    },
    sections: {
      games: { type: String, default: 'Coming Soon' },
      bonus: { type: String, default: 'Coming Soon' },
      announcements: { type: String, default: 'No Updates' },
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    hasChanges: {
      type: Boolean,
      default: false,
    },
    changes: [ChangeDetailSchema],
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient queries
SnapshotSchema.index({ website: 1, checkedAt: -1 });

export default mongoose.models.Snapshot ||
  mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
