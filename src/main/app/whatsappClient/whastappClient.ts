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

      console.time('Get Chats');
      const chats = await client.getChats();
      console.timeEnd('Get Chats');

      payload.forEach((el) => {
        const jaoGroup = chats.find(
          (chat) => chat.name === el.Contato && chat.isGroup,
        ) || { id: { _serialized: '' } };

        // Enviar mensagem de texto
        if (jaoGroup?.id._serialized !== '') {
          // client
          //   .sendMessage(jaoGroup?.id._serialized, el.Mensagem as string)
          //   .then((response) => {
          //     console.log('Mensagem enviada:', response.id.toString());
          //   })
          //   .catch((err) => {
          //     console.error('Erro ao enviar mensagem:', err);
          //   });

          // Enviar PDF
          const pdfPath: any = el.Arquivo; // Substitua pelo caminho do seu arquivo PDF

          const media = new MessageMedia(
            'application/pdf',
            fs.readFileSync(pdfPath).toString('base64'),
            getFileName(pdfPath),
          );

          client
            .sendMessage(jaoGroup.id._serialized, media, {
              caption: el.Mensagem as string,
            })
            .then((response) => {
              console.log('PDF enviado:', response.id.toString());
            })
            .catch((err) => {
              console.error('Erro ao enviar PDF:', err);
            });
        }
      });
    } catch (err) {
      console.log(err);
    }
    // }
  });

  client.initialize();
};
