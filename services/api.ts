import axios from 'axios';
import { getToken } from './storage';


const api = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000, 
});

api.interceptors.request.use(async (config) => {
  const token = await getToken(); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
