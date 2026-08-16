import mongoose from "mongoose";

const auditLogSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      userName: {
        type: String,
        default: null,
      },

      userEmail: {
        type: String,
        default: null,
      },

      action: {
        type: String,
        required: true,
        enum: [
          "CREATE",
          "UPDATE",
          "DELETE",
          "STATUS_UPDATE",
          "LOGIN",
          "LOGOUT",
        ],
      },

      module: {
        type: String,
        required: true,
        enum: [
          "AUTH",
          "USER",
          "PRODUCT",
          "CATEGORY",
          "PROFILE",
          "SETTINGS",
          "OTHER",
        ],
      },

      description: {
        type: String,
        required: true,
      },

      recordId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      oldData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      newData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      method: {
        type: String,
        default: null,
      },

      endpoint: {
        type: String,
        default: null,
      },

      ipAddress: {
        type: String,
        default: null,
      },

      userAgent: {
        type: String,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "SUCCESS",
          "FAILED",
        ],
        default: "SUCCESS",
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

auditLogSchema.index({
  createdAt: -1,
});

auditLogSchema.index({
  user: 1,
});

auditLogSchema.index({
  module: 1,
});

auditLogSchema.index({
  action: 1,
});

auditLogSchema.index({
  status: 1,
});

export default mongoose.model(
  "AuditLog",
  auditLogSchema
);