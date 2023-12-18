import { BrowserWindow } from 'electron';
import {
  Client as WhatsAppClient,
  LocalAuth,
  MessageMedia,
} from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';

interface TransformedObject {
  [key: string]: string | number;
}

function getFileName(path: string) {
  // Dividir o caminho pelo separador de diretórios
  const parts = path.split('\\');

  // Pegar a última parte, que deve ser o nome do arquivo
  const fileName = parts[parts.length - 1];

  return fileName;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const whatsAppCall = (
  mainWindow: BrowserWindow,
  payload: TransformedObject[],
) => {
  const client = new WhatsAppClient({});

  client.on('qr', async (qr) => {
    const qrCodeDataURL = await qrcode.toDataURL(qr);
    mainWindow?.webContents.send('qr', qrCodeDataURL);
  });

  client.on('authenticated', (session) => {
    console.log('Authenticated', session);
  });

  client.on('auth_failure', (msg) => {
    console.error('Authentication failure', msg);
  });

  client.on('ready', async () => {
    try {
      console.log('Client is ready');
      mainWindow?.webContents.send('loadingSend', 'INIT_SEND');
      console.time('Get Chats');
      const chats = await client.getChats();
      console.timeEnd('Get Chats');

      for (const el of payload) {
        const jaoGroup = chats.find(
          (chat) =>
            chat?.name?.toUpperCase() === String(el?.Contato)?.toUpperCase() &&
            chat.isGroup,
        ) || { id: { _serialized: '' } };

        // Enviar mensagem de texto
        if (jaoGroup?.id._serialized !== '') {
          // Enviar PDF
          const pdfPath: any = el.Arquivo; // Substitua pelo caminho do seu arquivo PDF

          const media = new MessageMedia(
            'application/pdf',
            fs.readFileSync(pdfPath).toString('base64'),
            getFileName(pdfPath),
          );

          await client.sendMessage(jaoGroup.id._serialized, media, {
            caption: el.Mensagem as string,
          });

          await sleep(10000); // Espera por 10 segundos
        } else {
          console.log(el?.Contato, ' : Não Enviou');
        }
      }

      mainWindow?.webContents.send('loadingSend', 'END_SEND');
    } catch (err) {
      console.log(err);
    }
  });

  client.initialize();
};
