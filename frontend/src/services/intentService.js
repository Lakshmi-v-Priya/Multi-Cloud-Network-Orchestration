import api from "./api";

export const validateIntent = async (intentData) => {
  const response = await api.post("/intents/validate", intentData);
  return response.data;
};
export const getSavedIntents = async () => {
  const response = await api.get("/intents/");
  return response.data;
};