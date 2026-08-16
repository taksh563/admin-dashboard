import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    userName: {
      type: String,
      default: "",
    },

    userEmail: {
      type: String,
      default: "",
    },

    action: {
      type: String,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "STATUS_UPDATE",
        "LOGIN",
        "LOGOUT",
      ],
      required: true,
    },

    module: {
      type: String,
      enum: [
        "AUTH",
        "USER",
        "PRODUCT",
        "CATEGORY",
        "PROFILE",
        "SETTINGS",
        "OTHER",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    method: {
      type: String,
      default: "",
    },

    endpoint: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster filtering
auditLogSchema.index({
  createdAt: -1,
});

auditLogSchema.index({
  user: 1,
  createdAt: -1,
});

auditLogSchema.index({
  module: 1,
  action: 1,
  createdAt: -1,
});

auditLogSchema.index({
  status: 1,
  createdAt: -1,
});

export default mongoose.model(
  "AuditLog",
  auditLogSchema
);