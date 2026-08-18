import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../../api/axios";

import { useToast } from "../../context/ToastContext";

import emailTemplateService from "../../services/emailTemplate.service";

import {replaceTemplateVariables,} from "../../utils/replaceTemplateVariable";


const ComposeEmail = () => {
  // =========================================
  // TEMPLATE STATE
  // =========================================

  const [emailMode, setEmailMode] = useState("normal");

  const [selectedUsers, setSelectedUsers] = useState([]);

  const [previewUser, setPreviewUser] = useState(null);

  const [templates, setTemplates] = useState([]);

  const [loadingTemplates, setLoadingTemplates] =
    useState(false);

  const [selectedTemplate, setSelectedTemplate] =
    useState("");

  // =========================================
  // NAVIGATION / TOAST
  // =========================================

  const navigate = useNavigate();

  const { showToast } = useToast();

  // =========================================
  // USERS
  // =========================================

  const [users, setUsers] = useState([]);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  // =========================================
  // FORM
  // =========================================

  const [formData, setFormData] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    text: "",
    html: "",
  });

  // =========================================
  // EMAIL STATE
  // =========================================

  const [sending, setSending] =
    useState(false);

  const [showCc, setShowCc] =
    useState(false);

  const [showBcc, setShowBcc] =
    useState(false);

  const [preview, setPreview] =
    useState(false);

  // =========================================
  // EMAIL VALIDATION
  // =========================================

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  };

  // =========================================
  // LOAD USERS
  // =========================================

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const response =
        await api.get("/users");

      const userData =
        response.data?.data ||
        response.data?.users ||
        [];

      setUsers(userData);
    } catch (error) {
      console.error(
        "Unable to load users:",
        error
      );

      showToast({
        type: "error",
        message: "Unable to load users",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // =========================================
  // LOAD ACTIVE EMAIL TEMPLATES
  // =========================================

  const fetchEmailTemplates =
    useCallback(async () => {
      try {
        setLoadingTemplates(true);

        const response =
          await emailTemplateService.getTemplates({
            page: 1,
            limit: 100,
            status: "ACTIVE",
          });

        const templateData =
          response?.data?.templates ||
          response?.data ||
          response?.templates ||
          [];

        setTemplates(
          Array.isArray(templateData)
            ? templateData
            : []
        );
      } catch (error) {
        console.error(
          "Unable to load email templates:",
          error
        );

        showToast({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Unable to load email templates.",
        });
      } finally {
        setLoadingTemplates(false);
      }
    }, [showToast]);

  useEffect(() => {
    fetchEmailTemplates();
  }, [fetchEmailTemplates]);

  // =========================================
  // GET USER VARIABLES
  // =========================================

  const getUserVariables = (email) => {
    const normalizedEmail =
      email?.trim().toLowerCase();

    const user = users.find(
      (item) =>
        item.email
          ?.trim()
          .toLowerCase() ===
        normalizedEmail
    );

    const now = new Date();

    return {
      name: user?.name || "",

      email:
        user?.email ||
        email ||
        "",

      role:
        user?.role || "",

      company:
        user?.company ||
        "Admin Dashboard",

      date:
        now.toLocaleDateString(),

      year:
        now.getFullYear(),
    };
  };

  // =========================================
  // TEMPLATE CHANGE
  // =========================================

  const handleTemplateChange = (e) => {
    const templateId =
      e.target.value;

    setSelectedTemplate(
      templateId
    );

    if (!templateId) {
      return;
    }

    const template =
      templates.find(
        (item) =>
          item._id === templateId
      );

    if (!template) {
      showToast({
        type: "error",
        message:
          "Unable to load selected email template.",
      });

      return;
    }

    // Populate original template content
    setFormData((prev) => ({
      ...prev,

      subject:
        template.subject || "",

      text:
        template.message || "",

      html:
        template.html || "",
    }));

    setPreview(false);
  };

  // =========================================
  // INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // RECIPIENT CHANGE
  // =========================================

  const handleRecipientChange = (
    field,
    value
  ) => {
    const emails = value
      .split(",")
      .map((email) =>
        email
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      [field]: emails,
    }));
  };

  // =========================================
  // ADD USER / EMAIL
  // =========================================

  const addUser = (
    field,
    email
  ) => {
    if (!email) return;

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // Validate email
    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      showToast({
        type: "error",
        message:
          "Please enter a valid email address.",
      });

      return;
    }

    setFormData((prev) => {
      // Prevent duplicate email
      if (
        prev[field].includes(
          normalizedEmail
        )
      ) {
        return prev;
      }

      return {
        ...prev,

        [field]: [
          ...prev[field],
          normalizedEmail,
        ],
      };
    });
  };

  // =========================================
  // REMOVE RECIPIENT
  // =========================================

  const removeRecipient = (
    field,
    email
  ) => {
    setFormData((prev) => ({
      ...prev,

      [field]: prev[field].filter(
        (item) => item !== email
      ),
    }));
  };

  // =========================================
  // SEND EMAIL
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // =======================================
    // VALIDATE TO RECIPIENT
    // =======================================

    if (
      !formData.to ||
      formData.to.length === 0
    ) {
      showToast({
        type: "error",
        message:
          "Recipient email is required.",
      });

      return;
    }

    // =======================================
    // VALIDATE RECIPIENT EMAILS
    // =======================================

    const invalidEmails =
      formData.to.filter(
        (email) =>
          !isValidEmail(email)
      );

    if (
      invalidEmails.length > 0
    ) {
      showToast({
        type: "error",
        message: `Invalid recipient email: ${invalidEmails[0]}`,
      });

      return;
    }

    // =======================================
    // VALIDATE SUBJECT
    // =======================================

    if (
      !formData.subject.trim()
    ) {
      showToast({
        type: "error",
        message:
          "Please enter email subject",
      });

      return;
    }

    // =======================================
    // VALIDATE MESSAGE
    // =======================================

    if (
      !formData.text.trim()
    ) {
      showToast({
        type: "error",
        message:
          "Please enter email message",
      });

      return;
    }

    try {
      setSending(true);

      // =====================================
      // BUILD PERSONALIZED RECIPIENTS
      // =====================================

      const personalizedRecipients =
        formData.to.map(
          (email) => {
            // Get user information
            const variables =
              getUserVariables(
                email
              );

            // Replace template variables
            const personalizedSubject =
              replaceTemplateVariables(
                formData.subject.trim(),
                variables
              );

            const personalizedMessage =
              replaceTemplateVariables(
                formData.text.trim(),
                variables
              );

            const personalizedHtml =
              replaceTemplateVariables(
                formData.html.trim(),
                variables
              );

            // Final HTML fallback
            const finalHtml =
              personalizedHtml ||
              `<div style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
              ">
                ${personalizedMessage.replace(
                  /\n/g,
                  "<br />"
                )}
              </div>`;

            console.log(
              "PERSONALIZED EMAIL:",
              {
                email,
                variables,
                subject:
                  personalizedSubject,
                message:
                  personalizedMessage,
              }
            );

            return {
              email,

              subject:
                personalizedSubject,

              message:
                personalizedMessage,

              html:
                finalHtml,
            };
          }
        );

      // =====================================
      // LOG
      // =====================================

      console.log(
        "PERSONALIZED RECIPIENTS:",
        personalizedRecipients
      );

      // =====================================
      // SEND REQUEST
      // =====================================

      const payload = {
        recipients:
          personalizedRecipients,

        cc:
          formData.cc || [],

        bcc:
          formData.bcc || [],
      };

      console.log(
        "EMAIL PAYLOAD:",
        payload
      );

      // =====================================
      // API
      // =====================================

      const response =
        await api.post(
          "/email/send",
          payload
        );

      console.log(
        "EMAIL RESPONSE:",
        response.data
      );

      // =====================================
      // BACKEND SUCCESS FALSE
      // =====================================

      if (
        !response.data?.success
      ) {
        showToast({
          type: "error",
          message:
            response.data?.message ||
            "Unable to send email.",
        });

        return;
      }

      // =====================================
      // SUCCESS
      // =====================================

      showToast({
        type: "success",
        message:
          response.data?.message ||
          "Emails sent successfully.",
      });

      // =====================================
      // RESET FORM
      // =====================================

      setFormData({
        to: [],
        cc: [],
        bcc: [],
        subject: "",
        text: "",
        html: "",
      });

      setSelectedTemplate("");

      setPreview(false);

      setShowCc(false);

      setShowBcc(false);

    } catch (error) {
      console.error(
        "Send email error:",
        error
      );

      console.log(
        "STATUS:",
        error?.response?.status
      );

      console.log(
        "SERVER RESPONSE:",
        error?.response?.data
      );

      const errorMessage =
        error?.response?.data?.message?.trim() ||
        error?.response?.data?.error?.trim() ||
        error?.message?.trim() ||
        "Unable to send email.";

      console.log(
        "TOAST MESSAGE:",
        errorMessage
      );

      showToast({
        type: "error",
        message:
          errorMessage,
      });

    } finally {
      setSending(false);
    }
  };

  // =========================================
  // RECIPIENT COMPONENT
  // =========================================

  const RecipientField = ({
    label,
    field,
  }) => {
    const recipients =
      formData[field];

    return (
      <div className="space-y-2">

        {/* LABEL + USER SELECT */}

        <div className="flex items-center justify-between">

          <label className="text-sm font-medium text-gray-700">

            {label}

            {field === "to" && (
              <span className="text-red-500 ml-1">
                *
              </span>
            )}

          </label>

          <select
            disabled={
              loadingUsers
            }
            className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value=""
            onChange={(e) => {
              addUser(
                field,
                e.target.value
              );
            }}
          >

            <option value="">
              {loadingUsers
                ? "Loading..."
                : "Select user"}
            </option>

            {users.map(
              (user) => (
                <option
                  key={
                    user._id
                  }
                  value={
                    user.email
                  }
                >
                  {user.name} (
                  {
                    user.email
                  }
                  )
                </option>
              )
            )}

          </select>

        </div>

        {/* RECIPIENT CONTAINER */}

        <div
          className={`
            min-h-[42px]
            flex
            flex-wrap
            gap-2
            border
            rounded-lg
            p-2
            focus-within:ring-2
            focus-within:ring-blue-500
            ${
              field === "to" &&
              recipients.length === 0
                ? "border-red-300"
                : "border-gray-300"
            }
          `}
        >

          {/* RECIPIENT CHIPS */}

          {recipients.map(
            (email) => (
              <span
                key={email}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm"
              >

                {email}

                <button
                  type="button"
                  onClick={() =>
                    removeRecipient(
                      field,
                      email
                    )
                  }
                  className="font-bold hover:text-red-600"
                  aria-label={`Remove ${email}`}
                >
                  ×
                </button>

              </span>
            )
          )}

          {/* EMAIL INPUT */}

          <input
            type="text"
            placeholder={
              recipients.length
                ? "Add another email..."
                : field === "to"
                ? "Enter recipient email address..."
                : "Enter email address..."
            }
            className="flex-1 min-w-[180px] outline-none text-sm"
            onKeyDown={(e) => {

              if (
                e.key === "Enter" ||
                e.key === ","
              ) {
                e.preventDefault();

                const email =
                  e.currentTarget.value
                    .trim()
                    .toLowerCase();

                if (email) {
                  addUser(
                    field,
                    email
                  );

                  // Clear only when valid
                  if (
                    isValidEmail(
                      email
                    )
                  ) {
                    e.currentTarget.value =
                      "";
                  }
                }
              }

            }}
          />

        </div>

        {/* REQUIRED MESSAGE */}

        {field === "to" &&
          recipients.length === 0 && (
            <p className="text-xs text-red-500">
              Recipient email is required.
            </p>
          )}

        {/* HELPER */}

        <p className="text-xs text-gray-400">
          Press Enter or comma to add an email.
        </p>

      </div>
    );
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="w-full">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="mb-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-gray-800">
              Compose Email
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Send an email to users from
              your admin dashboard.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/email/history"
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Email History
          </button>

        </div>

      </div>

      {/* =====================================
          MAIN CARD
      ====================================== */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        <form
          onSubmit={
            handleSubmit
          }
          className="p-5 md:p-7 space-y-5"
        >

          {/* =====================================
              EMAIL TEMPLATE
          ====================================== */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-medium text-gray-700">
                Email Template
              </label>

              {selectedTemplate && (
                <button
                  type="button"
                  onClick={() => {

                    setSelectedTemplate(
                      ""
                    );

                    setFormData(
                      (prev) => ({
                        ...prev,

                        subject: "",
                        text: "",
                        html: "",
                      })
                    );

                    setPreview(
                      false
                    );

                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear Template
                </button>
              )}

            </div>

            <select
              value={
                selectedTemplate
              }
              onChange={
                handleTemplateChange
              }
              disabled={
                loadingTemplates
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >

              <option value="">
                {loadingTemplates
                  ? "Loading templates..."
                  : "Select an email template"}
              </option>

              {templates.map(
                (template) => (
                  <option
                    key={
                      template._id
                    }
                    value={
                      template._id
                    }
                  >
                    {template.name}
                  </option>
                )
              )}

            </select>

            <p className="mt-1.5 text-xs text-gray-500">
              Selecting a template automatically fills the subject,
              message and HTML content.
            </p>

            {/* =================================
                AVAILABLE VARIABLES
            ================================== */}

            {selectedTemplate && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">

                <p className="text-xs font-semibold text-blue-800 mb-2">
                  Available template variables
                </p>

                <div className="flex flex-wrap gap-2">

                  {[
                    "{{name}}",
                    "{{email}}",
                    "{{role}}",
                    "{{company}}",
                    "{{date}}",
                    "{{year}}",
                  ].map(
                    (variable) => (
                      <span
                        key={
                          variable
                        }
                        className="rounded-md bg-white border border-blue-200 px-2 py-1 text-xs font-mono text-blue-700"
                      >
                        {variable}
                      </span>
                    )
                  )}

                </div>

                <p className="mt-2 text-xs text-blue-700">
                  Variables are automatically replaced using the selected recipient's information when the email is sent.
                </p>

              </div>
            )}

          </div>

          {/* =====================================
              TO
          ====================================== */}

          <RecipientField
            label="To"
            field="to"
          />

          {/* =====================================
              CC / BCC BUTTONS
          ====================================== */}

          <div className="flex gap-4">

            {!showCc && (
              <button
                type="button"
                onClick={() =>
                  setShowCc(true)
                }
                className="text-sm text-blue-600 hover:underline"
              >
                + Add CC
              </button>
            )}

            {!showBcc && (
              <button
                type="button"
                onClick={() =>
                  setShowBcc(true)
                }
                className="text-sm text-blue-600 hover:underline"
              >
                + Add BCC
              </button>
            )}

          </div>

          {/* =====================================
              CC
          ====================================== */}

          {showCc && (
            <RecipientField
              label="CC"
              field="cc"
            />
          )}

          {/* =====================================
              BCC
          ====================================== */}

          {showBcc && (
            <RecipientField
              label="BCC"
              field="bcc"
            />
          )}

          {/* =====================================
              SUBJECT
          ====================================== */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>

            <input
              type="text"
              name="subject"
              value={
                formData.subject
              }
              onChange={
                handleChange
              }
              placeholder="Enter email subject"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* =====================================
              MESSAGE
          ====================================== */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-medium text-gray-700">
                Message
              </label>

              <button
                type="button"
                onClick={() =>
                  setPreview(
                    !preview
                  )
                }
                className="text-sm text-blue-600 hover:underline"
              >
                {preview
                  ? "Edit Message"
                  : "Preview"}
              </button>

            </div>

            {!preview ? (

              <textarea
                name="text"
                value={
                  formData.text
                }
                onChange={
                  handleChange
                }
                rows={12}
                placeholder="Write your email message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            ) : (

              <div className="min-h-[280px] border border-gray-300 rounded-lg p-5 bg-gray-50">

                <div className="bg-white rounded-lg p-5 shadow-sm">

                  <h2 className="text-lg font-semibold mb-4">
                    {formData.subject ||
                      "Email Preview"}
                  </h2>

                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.text ||
                      "No message entered."}
                  </div>

                </div>

              </div>

            )}

          </div>

          {/* =====================================
              ADVANCED HTML
          ====================================== */}

          <details className="border border-gray-200 rounded-lg">

            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
              Advanced HTML Email
            </summary>

            <div className="p-4">

              <textarea
                name="html"
                value={
                  formData.html
                }
                onChange={
                  handleChange
                }
                rows={10}
                placeholder="<h2>Hello</h2><p>Your HTML email...</p>"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

          </details>

          {/* =====================================
              FOOTER
          ====================================== */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-gray-200">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/email/history"
                )
              }
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending
                ? "Sending..."
                : "Send Email"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default ComposeEmail;