import api from "./api";

export const getOptimization = async (intentId) => {
  const response = await api.get(`/optimization/${intentId}`);
  return response.data;
};