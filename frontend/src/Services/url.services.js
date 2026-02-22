import axios from "axios";

const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getToken = () => localStorage.getItem("auth_token");

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
