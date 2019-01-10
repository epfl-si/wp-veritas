import * as axios from 'axios';

const apiWPSite = axios.create({
  baseURL: 'http://localhost:3001/api'
})

export default apiWPSite;