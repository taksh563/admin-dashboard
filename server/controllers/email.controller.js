import emailService from "../services/email.service.js";

export const sendEmail = async (
  req,
  res
) => {
  try {
    const {
      to,
      subject,
      message,
    } = req.body;

    // =====================================
    // VALIDATION
    // =====================================

    if (!to) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient email is required.",
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message:
          "Email subject is required.",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message:
          "Email message is required.",
      });
    }

    // =====================================
    // SEND EMAIL
    // =====================================

    const result =
      await emailService.sendEmail({
        to,
        subject,

        text: message,

        html: `
          <div style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
          ">
            ${message}
          </div>
        `,
      });

    return res.status(200).json({
      success: true,
      message:
        "Email sent successfully.",
      data: result,
    });

  } catch (error) {

    console.error(
      "Send email controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send email.",
    });
  }
};