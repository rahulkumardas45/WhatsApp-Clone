import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

 const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  
});

export default axiosInstance;

