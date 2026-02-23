import type * as Where from '@where-org/where-common';
import type { connection as WebSocketConnection } from 'websocket';

// where-socket-app-module

// parameters

// SocketAppSend
export type SocketAppSend = <T>(data: T) => void;

// SocketAppClientAttributeBase
export type SocketAppClientAttributeBase = {

  id   : string,
  ip   : string,
  app  : string | number,
  group: string | number,
  user : string | number,

};

// SocketAppClientAttribute
export type SocketAppClientAttribute = SocketAppClientAttributeBase & {

  [key: string | number]: string | number,

};

// SocketAppClientSocket
export type SocketAppClientSocket = {

  connection: WebSocketConnection,

  send: SocketAppSend,
  on  : Where.On,
  emit: Where.Emit,

};

// SocketAppClient
export type SocketAppClient = SocketAppClientAttributeBase & {

  socket: SocketAppClientSocket,

  [key: string | number]: string | number | SocketAppClientSocket,

};

// SocketAppClients
export type SocketAppClients = SocketAppClient[];

// return

// SocketAppOnOpen
export type SocketAppOnOpen = () => Promise<void>;

// SocketAppOnMessage
export type SocketAppOnMessage = <T = Where.DataObject>
  (data: Where.DataArray<T>, condition: Where.ConditionObject) => Promise<void>;

// SocketAppOnClose
export type SocketAppOnClose = (code: number, desc: string) => Promise<void>;

// SocketAppOn
export type SocketAppOn = {

  open   : SocketAppOnOpen,
  message: SocketAppOnMessage,
  close  : SocketAppOnClose,

};

// interface

// SocketApp
export interface SocketApp {

  connect
    (socket: SocketAppClient, clients: SocketAppClients): Promise<SocketAppOn>;

  end?
    (): Promise<void>;

}

// constructor parameters

// SocketAppConfig
export type SocketAppConfig = Where.Credentials;

// Env - where.env
export type Env<T = string | number> = Where.DataObject<T>;

// Common - where.common
export type Common = {

  file: Where.CommonFile,
  util: Where.CommonUtil,

};

// Cq - where.cq
export type Cq = {

  parse : Where.CqParse,
  string: Where.CqString,

};

// Da - where.da
export type Da = {
  filter: Where.DaFilter,
};

// SocketAppLib
export type SocketAppLib = {

  log: Where.Log,
  env: Env,

  common: Common,
  cq: Cq,
  da: Da,

  ConnectionException: typeof Where.ConnectionException,
  ServerException: typeof Where.ServerException,
  UrlException: typeof Where.UrlException,

};

// shortcut

// parameters

//export type ClientSocket = SocketAppClientSocket;
//export type Client       = SocketAppClient;
//export type Clients      = SocketAppClients;

// constructor parameters

//export type Config = SocketAppConfig;
//export type Lib    = SocketAppLib;

// return

//export type Open    = SocketAppOnOpen;
//export type Message = SocketAppOnMessage;
//export type Close   = SocketAppOnClose;
//export type On      = SocketAppOn;
