import fs from 'fs';
import jimp from 'jimp';

const dbPath = './database/users.json';

export function loadUsers() {
  return JSON.parse(fs.readFileSync(dbPath)).users;
}

export function saveUsers(users) {
  fs.writeFileSync(dbPath, JSON.stringify({ users }, null, 2));
}

export function findUser(jid) {
  const users = loadUsers();
  return users.find(u => u.jid === jid);
}

export function updateUserBalance(jid, amount) {
  const users = loadUsers();
  const user = users.find(u => u.jid === jid);
  if (user) {
    user.balance += amount;
    saveUsers(users);
  }
}

export function deductUserBalance(jid, amount) {
  const users = loadUsers();
  const user = users.find(u => u.jid === jid);
  if (user && user.balance >= amount) {
    user.balance -= amount;
    saveUsers(users);
    return true;
  }
  return false;
}

export async function createInvoiceImage(data, outputPath) {
  const image = await jimp.read('./media/template.jpg');
  const font = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);
  image.print(font, 10, 10, `Tanggal: ${data.date}`);
  image.print(font, 10, 30, `Invoice: ${data.invoice}`);
  image.print(font, 10, 50, `Status: ${data.status}`);
  image.print(font, 10, 70, `Produk: ${data.product}`);
  image.print(font, 10, 90, `Tujuan: ${data.target}`);
  image.print(font, 10, 110, `Nickname: ${data.nickname}`);
  image.print(font, 10, 130, `SN: ${data.sn}`);
  await image.writeAsync(outputPath);
}
