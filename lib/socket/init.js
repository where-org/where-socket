import path from 'path';

const init = async (name, c, w) => {

  // where
  const {init, ...common} = w.common;

  const log = init.log({module: 'socket-app', app: name}),
        where = {...w, log, common};

  // config
  const config = c.app[name];

  // app
  const appConfig = {...config.app, ...await init.credential(config.app)},
        args = [appConfig, where];

  const appImport = await import(config.importPath).catch(async err => false);
  return appImport ? await appImport['app' in appImport ? 'app' : 'default'](...args) : false;

}

// wrapper
const wrapper = async (config, where) => {

  return await Object.entries(config.app).reduce(async (o, [k, v]) => {

    const app = await init(k, config, where);
    return (app) ? {...await o, [k]: app} : await o;

  }, {});

}

export { wrapper as init };
