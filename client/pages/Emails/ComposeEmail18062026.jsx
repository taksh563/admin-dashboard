import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import {getErrorMessage,} from "../../utils/errorMessage";
import emailTemplateService from "../../services/emailTemplate.service";

const ComposeEmail = () => {

  const [templates, setTemplates] = useState([]);

const [loadingTemplates, setLoadingTemplates] =
  useState(false);

const [selectedTemplate, setSelectedTemplate] =
  useState("");
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    text: "",
    html: "",
  });

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [showCc, setShowCc] =
    useState(false);

  const [showBcc, setShowBcc] =
    useState(false);

  const [preview, setPreview] =
    useState(false);

  // -----------------------------------------
  // Load users
  // -----------------------------------------

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

      showToast(
        "Unable to load users",
        "error"
      );

    } finally {
      setLoadingUsers(false);
    }
  };

  // -----------------------------------------
  // Load active email templates
  // -----------------------------------------

  const fetchEmailTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);

      const response = await emailTemplateService.getTemplates({
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

  // -----------------------------------------
  // Template change
  // -----------------------------------------

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;

    setSelectedTemplate(templateId);

    if (!templateId) {
      return;
    }

    const template = templates.find(
      (item) => item._id === templateId
    );

    if (!template) {
      showToast({
        type: "error",
        message: "Unable to load selected email template.",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      subject: template.subject || "",
      text: template.message || "",
      html: template.html || "",
    }));

    setPreview(false);
  };

  // -----------------------------------------
  // Input change
  // -----------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // Recipient change
  // -----------------------------------------

  const handleRecipientChange = (
    field,
    value
  ) => {
    const emails = value
      .split(",")
      .map((email) =>
        email.trim().toLowerCase()
      )
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      [field]: emails,
    }));
  };

  // -----------------------------------------
  // Select user
  // -----------------------------------------

  const addUser = (field, email) => {
    if (!email) return;

    setFormData((prev) => {

      if (
        prev[field].includes(email)
      ) {
        return prev;
      }

      return {
        ...prev,
        [field]: [
          ...prev[field],
          email,
        ],
      };
    });
  };

  // -----------------------------------------
  // Remove recipient
  // -----------------------------------------

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

  // -----------------------------------------
  // Send email
  // -----------------------------------------
const handleSubmit = async (e) => {
  e.preventDefault();

  // -----------------------------------------
  // Validate To
  // -----------------------------------------

  if (
    !formData.to ||
    formData.to.length === 0
  ) {
    showToast({
      type: "error",
      message:
        "Please add at least one recipient",
    });

    return;
  }

  // -----------------------------------------
  // Validate Subject
  // -----------------------------------------

  if (!formData.subject.trim()) {
    showToast({
      type: "error",
      message:
        "Please enter email subject",
    });

    return;
  }

  // -----------------------------------------
  // Validate Message
  // -----------------------------------------

  if (!formData.text.trim()) {
    showToast({
      type: "error",
      message:
        "Please enter email message",
    });

    return;
  }

  try {
    setSending(true);

    // -----------------------------------------
    // Payload
    // -----------------------------------------

    const payload = {
      to: formData.to,

      cc: formData.cc || [],

      bcc: formData.bcc || [],

      subject:
        formData.subject.trim(),

      message:
        formData.text.trim(),

      html:
        formData.html.trim() ||
        `<div style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
        ">
          ${formData.text
            .trim()
            .replace(
              /\n/g,
              "<br />"
            )}
        </div>`,
    };

    console.log(
      "EMAIL PAYLOAD:",
      payload
    );

    // -----------------------------------------
    // API
    // -----------------------------------------

    const response =
      await api.post(
        "/email/send",
        payload
      );

    console.log(
      "EMAIL RESPONSE:",
      response.data
    );

    // -----------------------------------------
    // Backend returned success:false
    // -----------------------------------------

    if (!response.data?.success) {
      showToast({
        type: "error",
        message:
          response.data?.message ||
          "Unable to send email.",
      });

      return;
    }

    // -----------------------------------------
    // Success
    // -----------------------------------------

    showToast({
      type: "success",
      message:
        response.data?.message ||
        "Email sent successfully.",
    });

    // -----------------------------------------
    // Reset form
    // -----------------------------------------

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

    // -----------------------------------------
    // Extract error message
    // -----------------------------------------

    const errorMessage =
      error?.response?.data?.message?.trim() ||
      error?.response?.data?.error?.trim() ||
      error?.message?.trim() ||
      "Unable to send email.";

    console.log(
      "TOAST MESSAGE:",
      errorMessage
    );

    // -----------------------------------------
    // Error Toast
    // -----------------------------------------

    showToast({
      type: "error",
      message: errorMessage,
    });

  } finally {
    setSending(false);
  }
};

  // -----------------------------------------
  // Recipient component
  // -----------------------------------------

  const RecipientField = ({
    label,
    field,
  }) => {
    const recipients =
      formData[field];


      

    return (
      <div className="space-y-2">

        <div className="flex items-center justify-between">

          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>

          <select
            disabled={loadingUsers}
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

            {users.map((user) => (
              <option
                key={user._id}
                value={user.email}
              >
                {user.name} (
                {user.email})
              </option>
            ))}
          </select>

        </div>

        <div className="min-h-[42px] flex flex-wrap gap-2 border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">

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
                >
                  ×
                </button>
              </span>
            )
          )}

          <input
            type="text"
            placeholder={
              recipients.length
                ? "Add another email..."
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

                  e.currentTarget.value =
                    "";
                }
              }
            }}
          />

        </div>

      </div>
    );
  };

  return (
    <div className="w-full">

      {/* Header */}

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
              navigate("/email/history")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Email History
          </button>

        </div>

      </div>

      {/* Main Card */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">

        <form
          onSubmit={handleSubmit}
          className="p-5 md:p-7 space-y-5"
        >

          {/* Email Template */}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Email Template
              </label>

              {selectedTemplate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplate("");

                    setFormData((prev) => ({
                      ...prev,
                      subject: "",
                      text: "",
                      html: "",
                    }));

                    setPreview(false);
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear Template
                </button>
              )}
            </div>

            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              disabled={loadingTemplates}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingTemplates
                  ? "Loading templates..."
                  : "Select an email template"}
              </option>

              {templates.map((template) => (
                <option
                  key={template._id}
                  value={template._id}
                >
                  {template.name}
                </option>
              ))}
            </select>

            <p className="mt-1.5 text-xs text-gray-500">
              Selecting a template automatically fills the subject,
              message and HTML content. You can edit them before sending.
            </p>
          </div>

          {/* To */}

          <RecipientField
            label="To"
            field="to"
          />

          {/* CC / BCC buttons */}

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

          {/* CC */}

          {showCc && (
            <RecipientField
              label="CC"
              field="cc"
            />
          )}

          {/* BCC */}

          {showBcc && (
            <RecipientField
              label="BCC"
              field="bcc"
            />
          )}

          {/* Subject */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter email subject"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Message */}

          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-medium text-gray-700">
                Message
              </label>

              <button
                type="button"
                onClick={() =>
                  setPreview(!preview)
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
                value={formData.text}
                onChange={handleChange}
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

                  <div
                    className="text-sm text-gray-700 whitespace-pre-wrap"
                  >
                    {formData.text ||
                      "No message entered."}
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* HTML */}

          <details className="border border-gray-200 rounded-lg">

            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
              Advanced HTML Email
            </summary>

            <div className="p-4">

              <textarea
                name="html"
                value={formData.html}
                onChange={handleChange}
                rows={10}
                placeholder="<h2>Hello</h2><p>Your HTML email...</p>"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

          </details>

          {/* Footer */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-gray-200">

            <button
              type="button"
              onClick={() =>
                navigate("/email/history")
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