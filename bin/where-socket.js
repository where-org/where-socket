#!/usr/bin/env node

import http from 'node:http';
import path from 'node:path';

import * as where from '../index.js';

const resolve = (module) => {
  return module.indexOf('#module') === -1 ? import.meta.resolve(module) : module;
};

// main
const main = async (dir) => {

  const port = process.env.npm_config_port || '5580',
        bind = process.env.npm_config_bind || '0.0.0.0';

  // config
  const socketConfig = await where.loadConfig(dir);

  const socketAppConfig = Object.entries(socketConfig.app).reduce((o, [k, v]) => (
    { ...o, [k]: { ...v, importPath: resolve(v.app.module) } }
  ), {});

  const socketAppMergedConfig = await where.mergeSpec(socketAppConfig, socketConfig.spec);

  // socket
  const httpServer = http.createServer(),
        webSocketServer = await where.createSocket({ ...socketConfig, app: socketAppMergedConfig }, httpServer);

  httpServer.listen(port, bind, () => {
    ;;; where.log(`Listening on ${bind}:${port}`);
  });

  httpServer.on('error', (err) => {
    const {code, syscall} = err;

    if (syscall !== 'listen') {
      throw err;
    }

    const { [code]: error } = {
      EACCES    : `Bind ${port} requires elevated privileges`,
      EADDRINUSE: `Port ${port} is already in use`
    };

    if (!error) {
      throw err;
    }

    ;;; where.log({ error });
    process.exit(1);
  });

};

const [, , dir] = process.argv;
main(path.resolve(...(dir ? [dir] : [import.meta.dirname, '../config'])));
