import mongoose from "mongoose";

const emailLogSchema =
  new mongoose.Schema(
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
      },

      message: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "SENT",
          "FAILED",
        ],
        default: "SENT",
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

emailLogSchema.index({
  createdAt: -1,
});

emailLogSchema.index({
  status: 1,
});

emailLogSchema.index({
  sentBy: 1,
});

export default mongoose.model(
  "EmailLog",
  emailLogSchema
);