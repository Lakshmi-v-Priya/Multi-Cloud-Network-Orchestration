import api from "./api";

export const getCloudComparison = async (intentId) => {
  const response = await api.get(`/comparison/${intentId}`);
  return response.data;
};