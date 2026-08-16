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

export default {
  sendEmail,
};