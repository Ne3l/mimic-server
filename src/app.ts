/* tslint:disable:no-console */
import express from 'express';
import HTTP from 'http';
import _ from 'lodash';

class App {
  port = process.env.PORT || 3000; // TODO: get port from the config file
  private express: express.Express;
  private config: IConfig;
  private httpServer?: HTTP.Server;
  private proxyServer?: any;

  constructor(config: IConfig) {
    this.config = config;
    this.express = express();
    this.mountRoutes();
  }

  isListening = (): boolean => {
    return this.httpServer ? this.httpServer.listening : false;
  };

  stop = (callback: ((error: Error) => void)) => {
    if (this.httpServer) {
      this.httpServer.close((error: Error) => {
        callback(error);
      });
    }
    // TODO: stop proxy server
  };

  start = (callback: ((error: Error) => void)) => {
    this.httpServer = this.express.listen(this.port, (error: Error) => {
      callback(error);
    });
  };

  private mountRoutes(): void {
    const { endpoints, projects } = this.config.entities;
    _.forEach(endpoints, (endpoint: IEndpoint) => {
      const project = projects[endpoint.projectId];
      this.register(endpoint, project.name);
    });
  }

  private register(endpoint: IEndpoint, scope = ''): void {
    const path = '/' + scope + endpoint.path;
    const method = endpoint.method.toLowerCase();
    const statusCode = endpoint.statusCode || 200;
    const timeout = endpoint.timeout || 0;

    this.express[method](path, (req: any, res: any) => {
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
}

export default App;
