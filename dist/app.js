"use strict";var __awaiter=this&&this.__awaiter||function(t,e,s,r){return new(s||(s=Promise))(function(o,i){function n(t){try{p(r.next(t))}catch(t){i(t)}}function h(t){try{p(r.throw(t))}catch(t){i(t)}}function p(t){var e;t.done?o(t.value):(e=t.value,e instanceof s?e:new s(function(t){t(e)})).then(n,h)}p((r=r.apply(t,e||[])).next())})},__importDefault=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0});const body_parser_1=__importDefault(require("body-parser")),express_1=__importDefault(require("express")),fs_1=__importDefault(require("fs")),http_1=__importDefault(require("http")),moment_1=__importDefault(require("moment")),router_1=__importDefault(require("./router"));let router;class App{constructor(t,e=!1){this.config={entities:{endpoints:[],projects:[]},result:{httpPort:3e3,httpsPort:3001}},this.isListening=(()=>!!this.httpServer&&this.httpServer.listening),this.stop=(t=>{this.httpServer&&this.httpServer.close(e=>{e||this.logServerClose(),t(e)})}),this.stopSync=(t=>__awaiter(this,void 0,void 0,function*(){const e=e=>{e||this.logServerClose(),t(e)};if(this.httpServer){let t=!1;for(this.httpServer.once("close",()=>{t=!0}),this.httpServer.close(e);!t;)yield sleep(500);return!0}return console.error("[app > stop-sync] No server to stop, weird!"),Promise.resolve(!0)})),this.start=(t=>{this.httpServer=http_1.default.createServer(this.express),this.httpServer.listen(this.port,e=>{e||t(e)}).on("error",t=>{this.errorHandler.checkErrorAndStopProcess(t)})}),this.switchConfig=(t=>{router=new router_1.default({config:t,loggingFunction:this.logMessage,port:this.port}).getExpressRouter()}),this.logServerClose=(()=>{this.logMessage({type:0,message:"START",date:moment_1.default().format("YYYY/MM/DD HH:mm:ss"),matched:!0})}),this.handleUIMessage=(t=>{switch(Number(t.toString())){case 0:return this.stop(this.handleError);case 1:return this.start(this.handleError)}}),this.handleError=(t=>{t&&this.logMessage({type:0,message:`ERROR ${t}`,matched:!0,date:moment_1.default().format("YYYY/MM/DD HH:mm:ss")})}),this.setupServer(this.config);const s="/tmp/apimocker_server";if(fs_1.default.existsSync(s)||fs_1.default.mkdirSync(s),this.errorHandler=t,e){const t=require("zeromq");this.socket=t.socket("pull"),this.socket.connect(`ipc://${s}/commands.ipc`),this.socket.on("message",this.handleUIMessage),this.socketLogs=t.socket("push"),this.socketLogs.bindSync(`ipc://${s}/logs.ipc`)}}setupServer(t){this.config=t;const{httpPort:e,httpsPort:s}=t.result;this.port=e||3e3,this.sslPort=s||3001,this.express=express_1.default(),this.express.use(body_parser_1.default.raw({type:"*/*"})),router=new router_1.default({config:t,loggingFunction:this.logMessage,port:this.port}).getExpressRouter(),this.express.use(function(t,e,s){router(t,e,s)})}logMessage(t){const e=JSON.stringify(t);return(this.socketLogs?this.socketLogs.send:console.log)(e)}}function sleep(t){return new Promise((e,s)=>setTimeout(()=>e(),t))}exports.default=App;