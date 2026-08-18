import transporter from "../utils/email.js";
import EmailLog from "../models/emailLog.model.js";
const sendEmail = async ({
  to,
  cc = [],
  bcc = [],
  subject,
  text = "",
  html = "",
  sentBy = null,
  emailLogId = null,
}) => {
  console.log(
    "========== SEND EMAIL START =========="
  );

  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Sent By:", sentBy);
  console.log("Email Log ID:", emailLogId);

  let emailLog = null;

  try {
    // =========================================
    // CREATE OR REUSE EMAIL LOG
    // =========================================

    if (emailLogId) {
      // ---------------------------------------
      // RESEND EXISTING EMAIL
      // ---------------------------------------

      emailLog =
        await EmailLog.findById(
          emailLogId
        );

      if (!emailLog) {
        throw new Error(
          "Email log not found."
        );
      }

      console.log(
        "♻️ REUSING EMAIL LOG:",
        emailLog._id.toString()
      );

      // Set back to pending
      emailLog.status = "PENDING";

      emailLog.errorMessage = null;

      // Update email data if required
      emailLog.to = Array.isArray(to)
        ? to
        : [to];

      emailLog.cc = Array.isArray(cc)
        ? cc
        : [];

      emailLog.bcc = Array.isArray(bcc)
        ? bcc
        : [];

      emailLog.subject = subject;

      emailLog.message = text;

      if (sentBy) {
        emailLog.sentBy = sentBy;
      }

      await emailLog.save();

    } else {
      // ---------------------------------------
      // NEW EMAIL
      // ---------------------------------------

      emailLog =
        await EmailLog.create({
          to: Array.isArray(to)
            ? to
            : [to],

          cc: Array.isArray(cc)
            ? cc
            : [],

          bcc: Array.isArray(bcc)
            ? bcc
            : [],

          subject,

          message: text,

          status: "PENDING",

          sentBy:
            sentBy || null,
        });

      console.log(
        "✅ EMAIL LOG CREATED:",
        emailLog._id.toString()
      );
    }

    // =========================================
    // SEND EMAIL
    // =========================================

    const result =
      await transporter.sendMail({
        from: {
          name:
            process.env.EMAIL_FROM_NAME ||
            "Admin Dashboard",

          address:
            process.env.EMAIL_FROM_ADDRESS ||
            process.env.SMTP_USER,
        },

        to,

        cc,

        bcc,

        subject,

        text,

        html,
      });

    console.log(
      "✅ EMAIL SENT:",
      result.messageId
    );

    // =========================================
    // UPDATE SENT
    // =========================================

    await EmailLog.findByIdAndUpdate(
      emailLog._id,
      {
        status: "SENT",

        messageId:
          result.messageId,

        errorMessage: null,

        ...(sentBy && {
          sentBy,
        }),
      }
    );

    console.log(
      "✅ EMAIL LOG UPDATED TO SENT"
    );

    console.log(
      "========== SEND EMAIL END =========="
    );

    return {
      success: true,

      messageId:
        result.messageId,

      logId:
        emailLog._id,

      status: "SENT",
    };

  } catch (error) {

    console.error(
      "❌ EMAIL ERROR:",
      error
    );

    // =========================================
    // UPDATE FAILED
    // =========================================

    if (emailLog?._id) {

      try {

        await EmailLog.findByIdAndUpdate(
          emailLog._id,
          {
            status: "FAILED",

            errorMessage:
              error?.message ||
              "Unable to send email.",
          }
        );

        console.log(
          "❌ EMAIL LOG UPDATED TO FAILED"
        );

      } catch (logError) {

        console.error(
          "❌ FAILED TO UPDATE EMAIL LOG:",
          logError
        );
      }
    }

    throw error;
  }
};

export default {
  sendEmail,
};