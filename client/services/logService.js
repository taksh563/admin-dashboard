import api from "../api/axios";

const getLogs = async (params = {}) => {
  const response = await api.get("/logs", {
    params,
  });

  return response.data;
};

export default {
  getLogs,
};