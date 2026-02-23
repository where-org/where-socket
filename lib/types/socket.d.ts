import type * as Where from '@where-org/where-common';

import type { Server as HttpServer } from 'http';
import type { server as WebSocketServer } from 'websocket';

// lib/socket.js

export type Socket = WebSocketServer;
export type SocketInit = (dir: string, httpServer: HttpServer) => Promise<Socket>;

// const

export declare const socket: SocketInit;
export declare const log: Where.Log;
