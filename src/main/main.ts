/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  Client as WhatsAppClient,
  LocalAuth,
  MessageMedia,
} from 'whatsapp-web.js';
import qrcode from 'qrcode';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  const client = new WhatsAppClient({});

  client.on('qr', async (qr) => {
    console.log('QR RECEIVED', qr);
    const qrCodeDataURL = await qrcode.toDataURL(qr);
    console.log('QR PASS', qr);
    mainWindow?.webContents.send('qr', qrCodeDataURL);
  });

  client.on('authenticated', (session) => {
    console.log('Authenticated', session);
  });

  client.on('auth_failure', (msg) => {
    console.error('Authentication failure', msg);
  });

  client.on('ready', async () => {
    console.log('Client is ready');
    const chats = await client.getChats();

    const jaoGroup = chats.find(
      (chat) => chat.name === 'Jão BOT' && chat.isGroup,
    ) || { id: { _serialized: '' } };

    // Enviar mensagem de texto
    if (jaoGroup?.id._serialized !== '') {
      client
        .sendMessage(jaoGroup?.id._serialized, 'U.u Jão BOT U.u')
        .then((response) => {
          console.log('Mensagem enviada:', response.id.toString());
        })
        .catch((err) => {
          console.error('Erro ao enviar mensagem:', err);
        });

      // Enviar PDF
      // const pdfPath = './files/example.pdf'; // Substitua pelo caminho do seu arquivo PDF
      // const media = new MessageMedia(
      //   'application/pdf',
      //   fs.readFileSync(pdfPath).toString('base64'),
      //   'example.pdf',
      // );

      // client
      //   .sendMessage(jaoGroup.id._serialized, media)
      //   .then((response) => {
      //     console.log('PDF enviado:', response.id.toString());
      //   })
      //   .catch((err) => {
      //     console.error('Erro ao enviar PDF:', err);
      //   });
    }
    // }
  });

  client.initialize();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
