import path from 'node:path';

import { nanoid } from 'nanoid';
import { server as WebSocketServer } from 'websocket';

import { common, cq, da } from '@where-org/where-common';

const file = { read: common.file.read };

const { filter } = da;

import { init } from './socket/index.js';

// mode
const mode = process.env.npm_config_mode || process.env.NODE_ENV || 'development',
      development = (mode === 'development') ? true : false;

/* log */
const log = common.init.log('socket');

/* loadConfig */
const loadConfig = async (dir) => {
  return await common.config.load(dir, mode, 'socket');
};

/* mergeSpec */
const mergeSpec = async (appConfig, specConfig) => {

  const resolveImportPathAppConfig = Object.entries(appConfig).reduce((o, [k, v]) => (
    { ...o, [k]: { ...v, importPath: v.importPath.indexOf('#module') === 0 ? import.meta.resolve(v.importPath) : v.importPath } }
  ), {});

  return await common.config.mergeSpec(resolveImportPathAppConfig, specConfig);
};

/* createSocket */
const createSocket = async (c, httpServer) => {

  // create
  const create = (connection, attribute) => {

    const socket = {
      connection,

      send: (data) => {
        connection.send(JSON.stringify(da.parse(data)));
      },

      on: (event, cb) => {
        connection.on(event, cb);
      },

      emit: (event, ...args) => {
        return connection.emit(event, ...args);
      }

    };

    return { socket, ...attribute };

  };

  // wrapper
  const wrapper = {

    open: async (socket, clients,  cb, ...args) => {

      const { socket: s, ...sender } = socket;

      const date = common.util.date.string(new Date());
      s.send([{message: 'hello', you: sender, date}]);

      await cb(...args).catch(err => {
        ;;; where.log({error: err.message});
      });

    },

    message: async (socket, clients, cb, message) => {

      const { socket: s, ...sender } = socket;

      const raw = await new Promise(resolve => resolve(JSON.parse(message.utf8Data))).catch(err => {
        s.send([{ error: err.message, sender }]);
      });

      if (!raw) {
        return;
      }

      const { data, condition = {} } = raw;

      await cb(da.parse(data || raw), condition).catch(err => {
        ;;; where.log({ error: err.message });
      });

    },

    close: async (socket, clients, cb, ...args) => {
      clients.map((v, i) => {
        if (v !== socket) {
          return;
        }
        clients.splice(i, 1);
        ;;; where.log({ close: v.id, clients: clients.length });
      });
  
      await cb(...args).catch(err => {
        ;;; where.log({ error: err.message });
      });

    },

  };

  const throughSubProtocol = (c.socket.ws.subProtocol === '*') ? true : false;

  // env
  const { name, version } = await common.file.read.json(path.resolve(import.meta.dirname, '../package.json'));

  const env = Object.entries({ name, version, mode }).reduce((o, [k, v]) => {

    const key = common.util.casing.camelToSnake(k).toUpperCase();
    return { ...o, [`SOCKET_${key}`]: v };

  }, {});

  // clients
  const clients = Object.keys(c.app).reduce((o, k) => {
    return { ...o, [k]: [] };
  }, {});

  // where object
  const where = {
    log, app: { env, cq, da: { filter }, common: { ...common, file } },
  }

  // where socket app
  const wa = await init(c, where.app);

  // websocket
  const websocket = new WebSocketServer({ httpServer, autoAcceptConnections: false });

  ;;; where.log({ message: 'Hello!', mode });

  // on
  websocket.on('request', async req => {

    const { requestedProtocols = [], origin = '' } = req;

    if (!c.socket.ws.allow.includes(origin) && !c.socket.ws.allow.includes('*')) {
      req.reject();

      ;;; where.log({ rejected: `origin: ${origin} is access denied.` });
      return;
    }

    if (!requestedProtocols.includes(c.socket.ws.subProtocol) && !throughSubProtocol) {
      req.reject();
      ;;; where.log({ rejected: `requestedProtocols: ${requestedProtocols} is access denied.` });
      return;
    }

    const resource = req.resource.replace(new RegExp(`^${c.socket.ws.prefix}`), ''),
          [key, group, user, argv] = resource.split('/').filter(v => v);

    const option = (!argv) ? null : argv.split(',').reduce((o, v) => {
      const [key, value] = v.split(':');
      return { ...o, [key]: value };
    }, {});

    if (!key || !group || !user) {
      req.reject();

      ;;; where.log({ rejected: `illegal values.` });
      return;
    }

    if (!wa[key]) {
      req.reject();

      ;;; where.log({ rejected: `app: ${key} is undefined.` });
      return;
    }

    const [id, ip] = [nanoid(), req.remoteAddress],
          attribute = { id, ip, app: key, group, user, ...option };

    ;;; where.log(attribute);

    const connection = req.accept((!requestedProtocols.length) ? null : requestedProtocols[0], req.origin);

    const socket = create(connection, attribute),
          on = await wa[key].connect(socket, clients[key]).catch(err => err);

    if (on instanceof Error) {
      ;;; where.log({ rejected: on.message }); // err.message

      connection.close();
      return;
    }

    clients[key].push(socket);

    const {socket: s} = socket;

    Object.entries(on).map(([k, v]) => {

      s.on(k, async (...args) => {
        wrapper[k](socket, clients[key], v, ...args);
      });

    });

    s.emit('open');

  });

  // end
  const end = async (code) => {

    await Promise.all(Object.entries(wa).map(async([k, v]) => {
      if (v.end) {
        await v.end();
      }
    }));

    process.exit(code);

  }

  Object.entries({ SIGINT: 2, SIGTERM: 15 }).map(([k, v]) => {
    process.on(k, async () => await end(v));
  });

  process.on('exit', async (code) => {
    ;;; where.log('See you!');
  });

  return websocket;

};

export { createSocket, loadConfig, mergeSpec, log, };
