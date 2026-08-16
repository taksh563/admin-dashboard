import transporter from "../utils/email.js";

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  try {
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

        subject,

        text,

        html,
      });

    console.log(
      "Email sent:",
      result.messageId
    );

    return {
      success: true,
      messageId:
        result.messageId,
    };
  } catch (error) {
    console.error(
      "Email sending error:",
      error
    );

    throw error;
  }
};

export default {
  sendEmail,
};