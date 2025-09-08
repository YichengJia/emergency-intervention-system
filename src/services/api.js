import axios from 'axios';

// Create an axios instance with the API base URL from environment variables
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api'
});

// Attach token to request headers if present
instance.interceptors.request.use(
  (config) => {
    const token = instance.defaults.headers.common['Authorization'];
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Set the authorization token. Should be called after login/registration and on logout.
 */
function setToken(token) {
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common['Authorization'];
  }
}

export default {
  get: instance.get,
  post: instance.post,
  put: instance.put,
  delete: instance.delete,
  setToken
};