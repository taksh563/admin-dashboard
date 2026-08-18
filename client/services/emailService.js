import api from "../api/axios";

const sendEmail = async (
  data
) => {
  const response =
    await api.post(
      "/email/send",
      data
    );

  return response.data;
};



const getEmailLogs = async (params = {}) => {
  const response = await api.get("/email/logs", {
    params,
  });

  return response.data;
};

const getEmailLogById = async (id) => {
  const response = await api.get(
    `/email/logs/${id}`
  );

  return response.data;
};

// const sendEmail = async (data) => {
//   const response = await api.post(
//     "/email/send",
//     data
//   );

//   return response.data;
// };

// ========================================
// RESEND EMAIL
// ========================================

const resendEmail = async (id) => {
  const response = await api.post(
    `/email/logs/${id}/resend`
  );

  return response.data;
};

export default {
  getEmailLogs,
  getEmailLogById,
  sendEmail,
  resendEmail,
};

