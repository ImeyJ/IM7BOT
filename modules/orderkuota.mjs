import axios from 'axios';
import { config } from '../config.mjs';

export async function getOrderKuotaList() {
  const res = await axios.get(`https://vip.resellerkuota.com/api/pulsa?apikey=${config.orderkuota.apikey}`);
  return res.data.data;
}

export async function orderKuotaTopup({ kode, target }) {
  const res = await axios.get(`https://vip.resellerkuota.com/api/order?apikey=${config.orderkuota.apikey}&kode=${kode}&tujuan=${target}`);
  return res.data;
}
