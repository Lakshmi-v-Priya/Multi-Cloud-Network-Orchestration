import api from "./api";

export const getOrchestrationPlan = async (intentId, provider) => {
  const response = await api.get(
    `/orchestration/${intentId}/plan`,
    {
      params: { provider },
    }
  );

  return response.data;
};