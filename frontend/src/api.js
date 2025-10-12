import axios from 'axios'
export const API = axios.create({ baseURL: import.meta.env.VITE_API || 'http://localhost:4000/api' })
