import axios from 'axios';


const BASE_URL =`${process.env.REACT_APP_BACKEND_URL}/api`;

  // console.log("ENV URL:", process.env.REACT_APP_BACKEND_URL);
const getToken = ()=>localStorage.getItem("auth_token")

 const axiosInstance = axios.create({
  baseURL:BASE_URL,
  // withCredentials: true,
});


axiosInstance.interceptors.request.use((config)=>{
  const token = getToken();
  if(token){
    config.headers.Authorization=`Bearer ${token}`
  }
  return config;
})

export default axiosInstance;

