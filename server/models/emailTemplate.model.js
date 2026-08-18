import mongoose from "mongoose";

const emailTemplateSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
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

      html: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "ACTIVE",
          "INACTIVE",
        ],
        default: "ACTIVE",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "EmailTemplate",
  emailTemplateSchema
);