import AuditLog from "../models/auditLog.model.js";

// const getClientIp = (req) => {
//     return (
//         req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
//         req.socket?.remoteAddress ||
//         req.ip ||
//         ""
//     );
// };

// export const createAuditLog = async ({
//     req,
//     action,
//     module,
//     description,
//     recordId = null,
//     status = "SUCCESS",
//     oldData = null,
//     newData = null,
// }) => {
//     try {
//         const user = req.user;

//         await AuditLog.create({
//             user: user?._id || null,

//             userName:
//                 user?.name || "",

//             userEmail:
//                 user?.email || "",

//             action,

//             module,

//             description,

//             recordId,

//             method:
//                 req.method || "",

//             endpoint:
//                 req.originalUrl || req.url || "",

//             ipAddress:
//                 getClientIp(req),

//             userAgent:
//                 req.headers["user-agent"] || "",

//             status,

//             oldData,

//             newData,
//         });
//     } catch (error) {
//         // Audit logging should never break
//         // the actual business operation.
//         console.error(
//             "Audit log error:",
//             error
//         );
//     }
// };

// export default createAuditLog;



export const createAuditLog = async ({
  req,
  user = null,
  action,
  module,
  description,
  recordId = null,
  oldData = null,
  newData = null,
  status = "SUCCESS",
  errorMessage = null,
}) => {
  try {
    // Use explicitly supplied user first.
    // Otherwise use req.user from JWT middleware.
    const actor = user || req.user || null;

    const log = await AuditLog.create({
      user: actor?._id || actor?.id || null,

      userName:
        actor?.name || null,

      userEmail:
        actor?.email || null,

      action,
      module,
      description,

      recordId,

      oldData,
      newData,

      method: req.method,

      endpoint:
        req.originalUrl ||
        req.url,

      ipAddress:
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket?.remoteAddress ||
        null,

      userAgent:
        req.headers["user-agent"] ||
        null,

      status,

      errorMessage,
    });

    return log;
  } catch (error) {
    // IMPORTANT:
    // Audit logging should never break
    // the actual application operation.
    console.error(
      "Audit log error:",
      error
    );

    return null;
  }
};