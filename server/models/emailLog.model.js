import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    to: {
      type: [String],
      required: true,
    },

    cc: {
      type: [String],
      default: [],
    },

    bcc: {
      type: [String],
      default: [],
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "SENT",
        "FAILED",
      ],
      default: "PENDING",
    },

    messageId: {
      type: String,
      default: null,
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailLogSchema.index({
  createdAt: -1,
});

emailLogSchema.index({
  status: 1,
});

emailLogSchema.index({
  sentBy: 1,
});

emailLogSchema.index({
  to: 1,
});

// IMPORTANT: Export the model
export default mongoose.model(
  "EmailLog",
  emailLogSchema
);