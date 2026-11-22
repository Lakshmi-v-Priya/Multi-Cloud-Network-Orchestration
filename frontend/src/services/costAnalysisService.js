import api from "./api";

export const getCostAnalysis = async (intentId) => {
  const response = await api.get(`/cost-analysis/${intentId}`);
  return response.data;
};