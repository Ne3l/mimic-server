"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const express_1=__importDefault(require("express")),body_parser_1=__importDefault(require("body-parser")),http_1=__importDefault(require("http")),lodash_1=__importDefault(require("lodash")),zeromq_1=require("zeromq"),moment_1=__importDefault(require("moment")),fs_1=__importDefault(require("fs")),request_1=__importDefault(require("request")),hostParser_1=require("./helpers/hostParser"),queryParamsMatcher_1=require("./helpers/queryParamsMatcher"),queryParser_1=require("./helpers/queryParser"),mockRequestAssembler_1=require("./helpers/mockRequestAssembler");class App{constructor(e){this.config={entities:{endpoints:[],projects:[]},result:{httpPort:3e3,httpsPort:3001}},this.endpointsParams=new Map,this.endpointsBody=new Map,this.endpointsResponse=new Map,this.isListening=(()=>!!this.httpServer&&this.httpServer.listening),this.stop=(e=>{const s=s=>{if(!s){const e={type:0,message:"STOP",date:moment_1.default().format("YYYY/MM/DD HH:mm:ss"),matched:!0};this.socketLogs.send(JSON.stringify(e))}e(s)};this.httpServer&&this.httpServer.close(s),this.sslServer&&this.sslServer.close(s)}),this.start=(e=>{if(this.httpServer=http_1.default.createServer(this.express),this.httpServer.listen(this.port,s=>{if(!s){const e={type:0,message:"START",date:moment_1.default().format("YYYY/MM/DD HH:mm:ss"),matched:!0};this.socketLogs.send(JSON.stringify(e))}e(s)}).on("error",e=>{this.errorHandler.checkErrorAndStopProcess(e)}),fs_1.default.existsSync("./localhost.key")&&fs_1.default.existsSync("./localhost.crt")){fs_1.default.readFileSync("./localhost.key"),fs_1.default.readFileSync("./localhost.crt")}}),this.handleUIMessage=(e=>{switch(Number(e.toString())){case 0:return this.stop(this.handleError);case 1:return this.start(this.handleError)}}),this.handleError=(e=>{if(!e)return;const s={type:0,message:`ERROR ${e}`,matched:!0,date:moment_1.default().format("YYYY/MM/DD HH:mm:ss")};this.socketLogs.send(JSON.stringify(s))}),this.sendLogForMockedRequest=(()=>{const e={type:0,message:"WARNING - Multiple mocked endpoints found",date:moment_1.default().format("YYYY/MM/DD HH:mm:ss"),matched:!0,isWarning:!0};this.socketLogs.send(JSON.stringify(e))}),this.setupServer(this.config);const s="/tmp/apimocker_server";fs_1.default.existsSync(s)||fs_1.default.mkdirSync(s),this.errorHandler=e,this.socket=zeromq_1.socket("pull"),this.socket.connect(`ipc://${s}/commands.ipc`),this.socket.on("message",this.handleUIMessage),this.socketLogs=zeromq_1.socket("push"),this.socketLogs.bindSync(`ipc://${s}/logs.ipc`)}setupServer(e){this.config=e;const{httpPort:s,httpsPort:t}=e.result;this.port=s||3e3,this.sslPort=t||3001,this.express=express_1.default(),this.express.use(body_parser_1.default.raw({type:"*/*"})),this.mountRoutes()}mountRoutes(){const{endpoints:e,projects:s}=this.config.entities;lodash_1.default.forEach(e,e=>{const t=s[e.projectId],r="/"+t.name+e.path;this.register(e,t.name),this.parseEndpointResponse(e,r),this.parseParamsEndpoint(e,r),this.parseBodyEndpoint(e,r)}),this.express.use("/",(e,s,t)=>{this.handleMissedRoute(e,s)})}parseEndpointResponse(e,s){e.request.params?this.endpointsResponse.set(e.method+s+e.request.params,e.response):e.request.body&&!lodash_1.default.isEqual(e.request.body,{})?this.endpointsResponse.set(e.method+s+JSON.stringify(e.request.body),e.response):this.endpointsResponse.set(e.method+s,e.response)}parseParamsEndpoint(e,s){const t=this.endpointsParams.get(s),r=t&&t.length>0?t:[];r.push(e.request.params),this.endpointsParams.set(s,r)}parseBodyEndpoint(e,s){const t=this.endpointsBody.get(s),r=t&&t.length>0?t:[];r.push(e.request.body),this.endpointsBody.set(s,r)}getAppropriateListenerFunction(e){if("delete"===e)return this.express.delete.bind(this.express);if("get"===e)return this.express.get.bind(this.express);if("patch"===e)return this.express.patch.bind(this.express);if("post"===e)return this.express.post.bind(this.express);if("put"===e)return this.express.put.bind(this.express);throw new Error("[getAppropriateListenerFunction] Unexpected API method to listen for")}sendLog(e,s,t,r,o){const i={method:e.method,path:e.path,body:e.body,matched:s,protocol:e.protocol,host:e.hostname,date:moment_1.default().format("YYYY/MM/DD HH:mm:ss"),port:parseInt(this.port.toString(),10),query:e.query,type:t,statusCode:r,response:o};this.socketLogs.send(JSON.stringify(i))}register(e,s=""){const t="/"+s+e.path,r=e.method.toLowerCase();this.getAppropriateListenerFunction(r)(t,(s,r)=>{const o=t.includes("*")?this.getResponseBodyByParams(t,s):this.getResponseBodyByParams(s.path,s);if(o){const t={requestObject:s,responseObject:r,statusCode:e.statusCode||200,timeout:e.timeout||0,responseBody:o};this.sendResponse(t)}else this.handleMissedRoute(s,r)})}getResponseBodyByParams(e,s){if(s.query&&!lodash_1.default.isEmpty(s.query)){return this.paramsExists(this.endpointsParams.get(e),s)?this.endpointsResponse.get(s.method+e+this.parseQueryToString(s.query)):void 0}if(s.body&&!lodash_1.default.isEmpty(s.body)){const t=s.body.toString("utf8");return this.bodyExists(this.endpointsBody.get(e),t)?this.isJsonString(t)?this.endpointsResponse.get(s.method+e+JSON.stringify(JSON.parse(t))):this.endpointsResponse.get(s.method+e+`"${t}"`):void 0}return this.endpointsResponse.get(s.method+e)}sendResponse(e){const{responseObject:s,requestObject:t,statusCode:r,timeout:o,responseBody:i}=e;o>0?setTimeout(()=>s.status(r).send(i),o):s.status(r).send(i),this.sendLog(t,!0,1,e.statusCode)}isJsonString(e){try{JSON.parse(e)}catch(e){return!1}return!0}bodyExists(e,s){let t=!1;return e.forEach(e=>{this.isJsonString(s)?lodash_1.default.isEqual(s,{})&&lodash_1.default.isEqual(e,s)?t=!0:lodash_1.default.isEqual(e,JSON.parse(s))&&(t=!0):lodash_1.default.isEqual(e,s)&&(t=!0)}),t}paramsExists(e,s){let t=!1;return e&&e.forEach(e=>{lodash_1.default.isEqual(queryParser_1.parseQuery(e),s.query)&&(t=!0)}),t}parseQueryToString(e){return"?"+Object.keys(e).reduce((s,t)=>(s.push(t+"="+encodeURIComponent(e[t])),s),[]).join("&")}handleMissedRoute(e,s){const t=e.originalUrl.split("/")[1],r=lodash_1.default.find(this.config.entities.projects,e=>e.name===t),{endpoints:o}=this.config.entities,{projects:i}=this.config.entities,n=queryParamsMatcher_1.getMockedEndpointForQuery(i,o,e);if(r&&r.urlPrefix&&!n)this.forwardRequest(e,s);else if(n&&n.length>0){const r=n[0];n&&n.length>1&&this.sendLogForMockedRequest(),mockRequestAssembler_1.sendMockedRequest(e,s,t,r,this.port)}else this.sendLog(e,!1,2,404),s.status(404).send("Not found")}getForwardingOptions(e){const[,s,...t]=e.originalUrl.split("/"),r=lodash_1.default.find(this.config.entities.projects,e=>e.name===s),{urlPrefix:o}=r,i=`${o}${o.endsWith("/")?"":"/"}${t.join("/")}`,n=hostParser_1.parseHost(i);return{headers:Object.assign({},e.headers,{host:n,"accept-encoding":""}),method:e.method,body:"GET"===e.method?null:e.body,uri:i,rejectUnauthorized:!1}}forwardRequest(e,s){const t=this.getForwardingOptions(e);request_1.default(t,(s,r,o)=>{const i=r.headers["content-encoding"];i&&i.includes("gzip")?this.forwardGzipRequest(t,e):s?this.sendLog(e,!1,3,0,s.toString()):this.sendLog(e,!0,2,r&&r.statusCode?r.statusCode:418,o.toString())}).pipe(s)}forwardGzipRequest(e,s){request_1.default(Object.assign({},e,{gzip:!0}),(e,t,r)=>{e?this.sendLog(s,!1,3,0,e.toString()):this.sendLog(s,!0,2,t&&t.statusCode?t.statusCode:418,r.toString())})}}exports.default=App;