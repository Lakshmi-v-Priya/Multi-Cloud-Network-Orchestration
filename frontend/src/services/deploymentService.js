import api from "./api";

export const prepareDeployment = async (intentId, provider) => {
  const response = await api.get(`/deployment/${intentId}/prepare`, {
    params: { provider },
  });

  return response.data;
};

export const generateTerraform = async (intentId, provider) => {
  const response = await api.get(`/deployment/${intentId}/terraform`, {
    params: { provider },
  });

  return response.data;
};