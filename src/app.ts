/* tslint:disable:no-console */
import express from 'express';
import HTTP from 'http';
import HTTPS from 'https';
import _ from 'lodash';
import { socket } from 'zeromq';
import fs from 'fs';

export const enum MessageTypes {
  STOP,
  RESTART,
  ERROR,
}

class App {
  private port: number;
  private sslPort: number;
  private express: express.Express;
  private config: IConfig;
  private httpServer?: HTTP.Server;
  private sslServer?: HTTPS.Server;
  private socket: any;

  constructor(config: IConfig) {
    this.config = config;

    const { httpPort, httpsPort } = config.result;
    this.port = httpPort || 3000;
    this.sslPort = httpsPort || 3001;

    this.express = express();
    this.mountRoutes();

    this.socket = socket('rep');
    this.socket.connect('ipc://server_commands.ipc');
    this.socket.on('message', this.handleUIMessage);
  }

  isListening = (): boolean => {
    return this.httpServer ? this.httpServer.listening : false;
  };

  stop = (callback: ((error: Error) => void)) => {
    const afterStop = (error: Error) => {
      if (!error) this.socket.send(MessageTypes.STOP);
      callback(error);
    };

    if (this.httpServer) this.httpServer.close(afterStop);
    if (this.sslServer) this.sslServer.close(afterStop);
  };

  start = (callback: ((error: Error) => void)) => {
    const afterStart = (error: Error) => {
      if (!error) this.socket.send(MessageTypes.RESTART);
      callback(error);
    };

    this.httpServer = HTTP.createServer(this.express).listen(this.port, afterStart);

    if (fs.existsSync('./localhost.key') && fs.existsSync('./localhost.crt')) {
      const sslOptions = {
        key: fs.readFileSync('./localhost.key'),
        cert: fs.readFileSync('./localhost.crt'),
      };
      this.sslServer = HTTPS.createServer(sslOptions, this.express).listen(this.sslPort, afterStart);
    }
  };

  restart = (callback: ((error: Error) => void)) => {
    if (this.httpServer || this.sslServer) this.stop(() => this.start(this.handleError));
    else this.start(this.handleError);
  };

  private handleUIMessage = (message: Uint8Array) => {
    const messageCode = Number(message.toString());
    console.log('Received message', message, messageCode);

    switch (messageCode) {
      case MessageTypes.STOP:
        return this.stop(this.handleError);
      case MessageTypes.RESTART:
        return this.restart(this.handleError);
      default:
    }
  };

  private handleError = (error: Error) => {
    if (!error) return;
    console.log('Sending error', error);
    this.socket.send(`${MessageTypes.ERROR}${error}`);
  };

  private mountRoutes(): void {
    const { endpoints, projects } = this.config.entities;
    _.forEach(endpoints, (endpoint: IEndpoint) => {
      const project = projects[endpoint.projectId];
      this.register(endpoint, project.name);
    });
    this.addMissedRouteHandler();
  }

  private getAppropriateListenerFunction(method: string): express.IRouterMatcher<express.Express> {
    if (method === 'delete') return this.express.get.bind(this.express);
    if (method === 'get') return this.express.get.bind(this.express);
    if (method === 'patch') return this.express.get.bind(this.express);
    if (method === 'post') return this.express.get.bind(this.express);
    if (method === 'put') return this.express.get.bind(this.express);

    throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
  }

  private register(endpoint: IEndpoint, scope = ''): void {
    const path = '/' + scope + endpoint.path;
    const method = endpoint.method.toLowerCase();
    const statusCode = endpoint.statusCode || 200;
    const timeout = endpoint.timeout || 0;

    const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
    httpMethodListenerFunction(path, (req: any, res: any) => {
      const response = this.substituteParams(endpoint.response, req.params);

      if (timeout > 0) {
        setTimeout(() => res.status(statusCode).send(response), timeout);
      } else {
        res.send(response);
      }
    });
  }

  private substituteParams(resp: any, params: any): any {
    for (const i in resp) {
      // Check nested objects recursively
      if (typeof resp[i] === 'object') {
        resp[i] = this.substituteParams(resp[i], params);
      } else if (typeof resp[i] === 'string' && resp[i][0] === ':') {
        // If value starts with a colon, substitute it with param value
        const paramName = resp[i].slice(1);
        resp[i] = params[paramName];
      }
    }
    return resp;
  }

  private addMissedRouteHandler() {
    this.express.use('/', (req: any, res: any, next: any) => {
      const response = this.handleUnmocked(req);
      res.status(404).send(response);
    });
  }

  private handleUnmocked(req: any): any {
    console.log('This URL is not mocked, TODO: forward it');
    // TODO: Log an unmocked request

    // TODO: return a forwarded response from the real API server
    return 'TODO: get a response from the origin API';
  }
}

export default App;
