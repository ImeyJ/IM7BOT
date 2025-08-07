import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import { config } from './config.mjs';
import { loadUsers, saveUsers, updateUserBalance, deductUserBalance, createInvoiceImage } from './modules/utils.mjs';
import { getDigiList, digiTopup } from './modules/digiflazz.mjs';
import { getOrderKuotaList, orderKuotaTopup } from './modules/orderkuota.mjs';
import { getMedanList, medanTopup } from './modules/medanpedia.mjs';

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async () => ({ conversation: 'ok' })
  });

  store.bind(sock.ev);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('Bot sudah online!');
    }
  });

  // Auto block penelpon
  sock.ev.on('call', async (json) => {
    const callerId = json[0]?.from;
    if (callerId) {
      await sock.sendMessage(callerId, { text: 'Bot akan memblokir nomor yang menelpon!' });
      await sock.updateBlockStatus(callerId, 'block');
    }
  });

  // Handle pesan masuk
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const sender = msg.pushName;

    // Tombol menu utama
    const menuButtons = [
      {
        buttonId: 'id_deposit',
        buttonText: { displayText: '💰 Deposit' },
        type: 1
      },
      {
        buttonId: 'id_topup',
        buttonText: { displayText: '⚡ Top Up' },
        type: 1
      },
      {
        buttonId: 'id_saldo',
        buttonText: { displayText: '💳 Cek Saldo' },
        type: 1
      }
    ];

    if (text === '/start' || text.toLowerCase().includes('menu')) {
      await sock.sendMessage(from, {
        text: `Halo ${sender}! Pilih layanan:`,
        buttons: menuButtons,
        headerType: 1
      });
    }

    if (text === '💳 Cek Saldo' || text === 'id_saldo') {
      const user = loadUsers().find(u => u.jid === from);
      const balance = user ? user.balance : 0;
      await sock.sendMessage(from, { text: `💰 Saldo Anda: Rp ${balance}` });
    }

    if (text === '💰 Deposit' || text === 'id_deposit') {
      await sock.sendMessage(from, {
        text: `Untuk deposit manual, transfer ke QRIS berikut dan kirim bukti:\n\n[QRIS LINK]\n\nSaldo akan masuk otomatis jika sesuai.`,
      });
    }

    if (text === '⚡ Top Up' || text === 'id_topup') {
      await sock.sendMessage(from, {
        text: 'Pilih provider:',
        buttons: [
          { buttonId: 'topup_digiflazz', buttonText: { displayText: '📱 Digiflazz' }, type: 1 },
          { buttonId: 'topup_orderkuota', buttonText: { displayText: '📶 OrderKuota' }, type: 1 },
          { buttonId: 'topup_medanpedia', buttonText: { displayText: '🎮 MedanPedia' }, type: 1 }
        ],
        headerType: 1
      });
    }

    // Contoh: Handle topup via Digiflazz
    if (text === 'topup_digiflazz') {
      const list = await getDigiList();
      let listMsg = '*📱 List Produk Digiflazz:*\n';
      list.slice(0, 10).forEach((item, i) => {
        listMsg += `${i + 1}. ${item.buyer_sku_code} - ${item.product_name} - Rp ${item.price}\n`;
      });
      await sock.sendMessage(from, { text: listMsg });
    }

    // Buat fitur lainnya sesuai struktur sama
  });
};

startSock();
