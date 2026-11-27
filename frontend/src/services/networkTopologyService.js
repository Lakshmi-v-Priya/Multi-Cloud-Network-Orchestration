import api from "./api";

export const generateNetworkTopology = async (intentId, provider) => {
  const response = await api.post("/network-topology/generate", {
    intent_id: intentId,
    provider: provider,
  });

  return response.data;
};