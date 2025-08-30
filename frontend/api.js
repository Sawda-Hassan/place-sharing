import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const api = axios.create({ baseURL });
