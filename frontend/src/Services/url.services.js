import axios from 'axios';


const BASE_URL =`${process.env.REACT_APP_BACKEND_URL}/api`;

  // console.log("ENV URL:", process.env.REACT_APP_BACKEND_URL);


 const axiosInstance = axios.create({
  baseURL:BASE_URL,
  withCredentials: true,
});

export default axiosInstance;

