import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config.mjs';

function sign(refId) {
  return crypto.createHash('md5').update(config.digiflazz.username + config.digiflazz.apikey + refId).digest('hex');
}

export async function getDigiList() {
  const signKey = sign('');
  const res = await axios.post('https://api.digiflazz.com/v1/price-list', {
    cmd: 'prepaid',
    username: config.digiflazz.username,
    sign: signKey
  });
  return res.data.data;
}

export async function digiTopup({ sku, target, refId }) {
  const res = await axios.post('https://api.digiflazz.com/v1/transaction', {
    username: config.digiflazz.username,
    buyer_sku_code: sku,
    customer_no: target,
    ref_id: refId,
    sign: sign(refId)
  });
  return res.data.data;
}
