import api from "./api";

export const validateInfrastructurePlan = async (
  intentId,
  provider
) => {
  const response = await api.get(
    `/validation/${intentId}/validate`,
    {
      params: { provider },
    }
  );

  return response.data;
};