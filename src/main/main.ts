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
import XLSX from 'xlsx';
import fs from 'fs';
import { whatsAppCall } from './app/whatsappClient/whastappClient';

interface OriginalObject {
  [key: string]: string | number;
}

interface TransformedObject {
  [key: string]: string | number;
}

const transformExcel = (list: OriginalObject[]): TransformedObject[] => {
  // Pegar o primeiro objeto da lista para usar como referência para as chaves
  const firstObject = list[0];

  // Criar um array para armazenar os novos objetos transformados
  const transformedList: TransformedObject[] = [];

  // Loop pelos objetos da lista, começando do índice 1
  for (let i = 1; i < list.length; i++) {
    const obj = list[i];
    const transformedObj: TransformedObject = {};

    // Loop pelas chaves do objeto original
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(firstObject, key)) {
        // Pegar a correspondente "chave humana" do primeiro objeto
        const newKey = firstObject[key];

        // Adicionar o valor ao novo objeto com a "chave humana"
        if (typeof newKey === 'string' || typeof newKey === 'number') {
          transformedObj[newKey] = obj[key];
        }
      }
    }

    // Adicionar o novo objeto transformado à lista transformada
    transformedList.push(transformedObj);
  }

  return transformedList;
};

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const rawData = fs.readFileSync('config.json', 'utf8');
const data = JSON.parse(rawData);
const filePath = data.filePath

ipcMain.on('save-filePath', (event, filePath) => {
  fs.writeFileSync('config.json', JSON.stringify({ filePath }));
});

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
    width: 1280,
    height: 720,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
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

  // Substitua pelo caminho real
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetNames[0]];
  const data = transformExcel(XLSX.utils.sheet_to_json(sheet));

  // Envie os dados para o renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('file-data', data);
    whatsAppCall(mainWindow as BrowserWindow, data);
  });

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
