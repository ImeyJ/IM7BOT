import axios from 'axios';
import { config } from '../config.mjs';

export async function getMedanList() {
  const res = await axios.get(`https://medanpedia.co.id/api/service?api_key=${config.medanpedia.apikey}`);
  return res.data.data;
}

export async function medanTopup({ service, target }) {
  const res = await axios.post('https://medanpedia.co.id/api/order', {
    api_key: config.medanpedia.apikey,
    service,
    target
  });
  return res.data;
}
