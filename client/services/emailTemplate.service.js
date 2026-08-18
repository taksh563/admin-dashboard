import api from "../api/axios";

const getTemplates = async (params = {}) => {
  const response = await api.get(
    "/email/templates",
    {
      params,
    }
  );

  return response.data;
};

const getTemplateById = async (id) => {
  const response = await api.get(
    `/email/templates/${id}`
  );

  return response.data;
};

const createTemplate = async (data) => {
  const response = await api.post(
    "/email/templates",
    data
  );

  return response.data;
};

const updateTemplate = async (
  id,
  data
) => {
  const response = await api.put(
    `/email/templates/${id}`,
    data
  );

  return response.data;
};

const deleteTemplate = async (id) => {
  const response = await api.delete(
    `/email/templates/${id}`
  );

  return response.data;
};

const updateTemplateStatus = async (
  id,
  status
) => {
  const response = await api.patch(
    `/email/templates/${id}/status`,
    {
      status,
    }
  );

  return response.data;
};

export default {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  updateTemplateStatus,
};