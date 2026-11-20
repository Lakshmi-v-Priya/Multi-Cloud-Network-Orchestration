
import api from './api'

export const validateIntent = async (intentData) => {
  const response = await api.post('/intents/validate', intentData)

  return response.data
}
