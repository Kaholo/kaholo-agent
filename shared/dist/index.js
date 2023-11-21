"use strict";var ae=Object.create;var M=Object.defineProperty;var se=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var le=Object.getPrototypeOf,pe=Object.prototype.hasOwnProperty;var q=(r,e)=>{for(var t in e)M(r,t,{get:e[t],enumerable:!0})},L=(r,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of ue(e))!pe.call(r,i)&&i!==t&&M(r,i,{get:()=>e[i],enumerable:!(n=se(e,i))||n.enumerable});return r};var I=(r,e,t)=>(t=r!=null?ae(le(r)):{},L(e||!r||!r.__esModule?M(t,"default",{value:r,enumerable:!0}):t,r)),ce=r=>L(M({},"__esModule",{value:!0}),r);var Ie={};q(Ie,{AgentTypeEnum:()=>oe,AmqpSdk:()=>D,EventsWorker:()=>f,VHOST:()=>b,amqpSdk:()=>F,calculateAgentState:()=>De,eventsWorker:()=>T,execCommand:()=>qe,executionDataHelper:()=>U,flowConsumer:()=>V,flowHelpers:()=>Q,flowInterpreter:()=>H,getActionsAndLinks:()=>Ve,rpcRequest:()=>K,withTransaction:()=>ve});module.exports=ce(Ie);var B=require("amqp-connection-manager");var _=require("uuid"),O=class{constructor(e={}){this.config={retryDelay:e.retryDelay??(process.env.SEQ_QUEUE_RETRY_DELAY?Number(process.env.SEQ_QUEUE_RETRY_DELAY):100),retryAttempts:e.retryAttempts??(process.env.SEQ_QUEUE_RETRY_ATTEMPTS?Number(process.env.SEQ_QUEUE_RETRY_ATTEMPTS):5)},this.callbacks={},this.results={},this.items=[],this.running=!1}deleteCurrentItem(){let e=this.items.shift();e&&(delete this.callbacks[e],delete this.results[e])}async runWithRetries(e){let t=this.items[0];try{let n=await this.callbacks[t]();this.results[t].resolve(n),this.deleteCurrentItem(),this.run().catch(i=>{console.error("Error during scheduling callback",i)})}catch(n){e<this.config.retryAttempts?(console.error(`Error during executing queue task (attempt: ${e})`,n),await new Promise(i=>setTimeout(i,this.config.retryDelay)),this.runWithRetries(e+1).catch(i=>{console.error("Error during scheduling callback",i)})):(console.error("Reached maximum queue retry attempts",n),this.results[t].reject(n),this.deleteCurrentItem(),this.run().catch(i=>{console.error("Error during scheduling callback",i)}))}}async run(){this.running=!0,this.items.length>0?await this.runWithRetries(1):this.running=!1}add(e){let t=(0,_.v4)();return this.callbacks[t]=e,this.items.push(t),this.running||this.run().catch(n=>{console.error("Error during scheduling callback",n)}),new Promise((n,i)=>this.results[t]={resolve:n,reject:i})}};var b=(n=>(n.RESULTS="results",n.ACTIONS="actions",n.EVENTS="events",n))(b||{});var ge=process.env.AMQP_CONNECTION_TIMEOUT||6e4,de=parseInt(process.env.AMQP_CONSUMER_DEFAULT_PREFETCH||"")||15,D=class{constructor(){this.connection={};this.channel={};this.consumerTag={["actions"]:{},["results"]:{},["events"]:{}};this.opts={};this.queues={["actions"]:[],["results"]:[],["events"]:[]};this.existingConsumers={["actions"]:{},["results"]:{},["events"]:{}};this.seqQueue=new O}getAmqpUri(e){switch(e){case"actions":return process.env.AMQP_URI_ACTIONS;case"events":return process.env.AMQP_URI_EVENTS;case"results":return process.env.AMQP_URI_RESULTS}}checkConnection(e){if(!this.channel[e])throw new Error("Connection not created")}async checkIfQueueExists(e,t){return this.channel[t].checkQueue(e)}async connectToAMQP(e){console.info(`Establishing connection to vhost ${e}`);let t=(0,B.connect)(this.getAmqpUri(e),{connectionOptions:this.opts.connectionOptions});if(t)try{let n=null;await Promise.race([new Promise((i,a)=>{n=setTimeout(()=>a(),Number(ge))}),new Promise(i=>{t.addListener("connect",()=>{console.info(`Rabbit successfully connected to vhost: "${e}"`),i()}),t.addListener("connectFailed",()=>{console.info(`Rabbit failed to connect to vhost: "${e}"`),process.exit(-2)}),t.addListener("disconnect",()=>{console.warn(`Rabbit disconnected from vhost: "${e}"`)}),t.addListener("blocked",()=>{console.warn(`Rabbit connection blocked on vhost: "${e}"`)}),t.addListener("unblocked",()=>{console.info(`Rabbit connection unblocked on vhost: "${e}"`)})})]),n&&clearTimeout(n),this.connection[e]=t}catch{console.error(`Rabbit connection timeout. Could not connect to vhost ${e}. Check connection details`),process.exit(-2)}else console.error(`Connection to vhost ${e} was not created!`),process.exit(-3);return t}async amqpConnect(e,t){let n=await this.connectToAMQP(e);if(n)return new Promise((i,a)=>{let s=n.createChannel({json:!0,setup:async l=>{if(l){this.channel[e]=l,t&&await t();for(let p in this.existingConsumers[e])this.existingConsumers[e][p].queueOptions?.exclusive&&await this.assertQueue(this.existingConsumers[e][p].queue,e,this.existingConsumers[e][p].queueOptions),await this.consume(this.existingConsumers[e][p]);await this.connectConsumers();for(let p of this.queues[e])this.publish(p);this.queues[e]=[],i(n)}a()}});s.addListener("connect",()=>{console.info(`Rabbit successfully connected to channel for vhost: "${e}"`)}),s.addListener("error",()=>{console.error(`Rabbit failed to connect to channel for vhost: "${e}"`)}),s.addListener("close",()=>{console.warn(`Rabbit connection to vhost: "${e}" channel has closed!"`)})});throw new Error("Could not connect to AMQP queue!")}async connectAndInit(e,t){(await this.amqpConnect(e,t)).on("close",()=>{console.error(`Lost AMQP connection with vhost: "${e}". Trying to reconnect in a while.`)})}async connectToVHosts(e){for(let t of e)await this.connectAndInit(t)}async configure(e,t=["events","results","actions"]){this.opts={...e},await this.connectToVHosts(t)}async unsubscribe(e,t,n){if(console.info(`Unsubscribing  from "${t}" queue in "${e}"`),this.checkConnection(e),!this.consumerTag[e][t]){if(n)return;throw new Error(`Cannot unsubscribe from "${t}" queue in "${e}" because consumer is undefined`)}await this.channel[e].cancel(this.consumerTag[e][t].consumerTag),delete this.existingConsumers[e][t],delete this.consumerTag[e][t]}publish({exchange:e,routingKey:t,vhost:n,data:i,opts:a={}}){this.checkConnection(n);try{return this.channel[n].publish(e,t,i,a)}catch(s){throw console.error(`Could not send message. Origin error: ${s.message}. Retrying when reconnected.`),this.queues[n].push({exchange:e,routingKey:t,vhost:n,data:i,opts:a}),s}}async connectConsumer(e,t){let n=async(g,m,o,u)=>{if(g===null)throw new Error("Received null message, channel closed. Trying to reconnect");let c;try{c=JSON.parse(g.content.toString())}catch{throw new Error("Incorrect incoming AMQP data")}o?await u(c,{ack:()=>this.channel[e].ack(g)}):(await u(c,{}),m&&this.channel[e].ack(g))},{prefetchValue:i,ack:a,explicitAck:s,callback:l}=this.existingConsumers[e][t];if(!await this.checkIfQueueExists(t,e))throw new Error("Queue does not exist!");await this.seqQueue.add(async()=>{await this.channel[e].prefetch(i),this.consumerTag[e][t]=await this.channel[e].consume(t,g=>{n(g,a,s,l).catch(m=>{console.error(`Error during processing message on queue ${t}.`,m)})},{noAck:!a})})}async connectConsumers(){for(let e of Object.keys(this.existingConsumers))for(let t of Object.keys(this.existingConsumers[e]))await this.connectConsumer(e,t)}async consume({vhost:e,queue:t,prefetchValue:n=de,ack:i=!1,explicitAck:a=!1,doConnect:s=!1,queueOptions:l={},callback:p}){this.checkConnection(e),this.existingConsumers[e][t]={vhost:e,queue:t,prefetchValue:n,ack:i,explicitAck:a,queueOptions:l,callback:p},s&&await this.connectConsumer(e,t)}async assertQueue(e,t,n){return this.checkConnection(t),(await this.channel[t].assertQueue(e,n)).queue}async deleteQueue(e,t){this.checkConnection(t),await this.channel[t].deleteQueue(e)}async assertExchange(e,t,n,i){this.checkConnection(n),await this.channel[n].assertExchange(e,t,i)}async bindQueue(e,t,n,i){this.checkConnection(n),await this.channel[n].bindQueue(e,t,i??"")}},F=new D;var z=I(require("os")),G=require("uuid"),me=parseInt(process.env.AMQP_CONSUMER_DEFAULT_PREFETCH||"")||15,f=class{constructor(){this.amqp=F}static parseQueue(e,t){let n=e;for(let[i,a]of Object.entries(t))n=n.replace(`{${i}}`,a);return n}async init(e,t){await this.amqp.configure(e,t)}async consume({vhost:e="events",queue:t,queueParams:n={},prefetchValue:i=me,ack:a=!0,explicitAck:s=!1,doConnect:l=!1,callback:p,queueOptions:g={}}){this.logging(`Asserting ${t} on vhost ${e} with params: $`,[n]);let m=f.parseQueue(t,n);await this.amqp.assertQueue(m,e,g),this.logging(`Consuming ${t} with prefetch: ${i}, ack: ${a}`),await this.amqp.consume({vhost:e,queue:m,prefetchValue:i,ack:a,explicitAck:s,doConnect:l,queueOptions:g,callback:this.consumerCallback(p)})}async consumeBroadcast({vhost:e="events",exchange:t,callback:n}){let i={exclusive:!0};this.logging(`Asserting ${t} exchange on vhost ${e}`),await this.amqp.assertExchange(t,"fanout",e);let a=await this.amqp.assertQueue(`broadcast/${t}/${(0,G.v4)()}`,e,i);await this.amqp.bindQueue(a,t,e),this.logging(`Consuming ${t} exchange`),await this.amqp.consume({vhost:e,queue:a,queueOptions:i,callback:this.consumerCallback(n)})}async publish({queue:e,queueParams:t={},event:n,vhost:i="events",opts:a={},queueOptions:s={}}){this.logging(`Publishing on queue ${e}, params $ with event $ and opts $`,[t,n,a]);let l=Buffer.from(JSON.stringify(n)),p=f.parseQueue(e,t);await this.amqp.assertQueue(p,i,s),this.amqp.publish({vhost:i,exchange:"",routingKey:p,data:l,opts:a})}async broadcast({exchange:e,event:t,vhost:n="events",opts:i={}}){this.logging(`Broadcasting to exchange ${e} with event $ and opts $`,[t,i]);let a=Buffer.from(JSON.stringify(t));await this.amqp.assertExchange(e,"fanout",n),this.amqp.publish({vhost:n,exchange:e,routingKey:"",data:a,opts:i})}async unsubscribe({queue:e,queueParams:t={},vhost:n="events",allowNotSubscribed:i=!1}){this.logging(`Unsubscribing from queue ${e} with params $`,[t]);let a=f.parseQueue(e,t);await this.amqp.unsubscribe(n,a,i)}async deleteQueue({queue:e,queueParams:t={},vhost:n="events"}){this.logging(`Deleting queue ${e} with params $`,[t]);let i=f.parseQueue(e,t);await this.amqp.deleteQueue(i,n)}async connectConsumers(){await F.connectConsumers()}logging(e,t){if(process.env.LOGGING_VERBOSE==="true"){let n=0,i=t?e.replace(/\$/g,()=>JSON.stringify(t[n++],null,2)):e;console.debug(`${z.default.hostname()}: ${i}`)}}consumerCallback(e){return process.env.LOGGING_VERBOSE==="true"?(t,n)=>(this.logging("Consumer debug: $",[t]),e?e(t,n):()=>Promise.resolve()):e||(()=>Promise.resolve())}},T=new f;var P=I(require("lodash/get"));var Q={};q(Q,{applyInputMapping:()=>C,composition:()=>he,condition:()=>Ee,flowTemplate:()=>R,parallel:()=>be,param:()=>Te,queue:()=>k});var $=I(require("lodash/get"));function j(r){return r.type==="event"}function W(r){return r.type==="param"}function ye(r){return Array.isArray(r)}function fe(r){return r.type==="condition"}function Y(r){return r.type==="composition"}function h(r,e,t){if(r.length===0)return t;let[n,...i]=r,a=h(i,e,t);if(Y(n))return h(n.restFlow,e,a);if(fe(n)){let{queue:s,predicate:l,elseFlow:p,thenFlow:g}=n;return[{vhost:s.vhost,queue:s.queue,errorQueue:s.errorQueue,inputMapping:s.inputMapping,outputMapping:s.outputMapping,errorMapping:s.errorMapping,queueParams:s.queueParams,predicate:l,nextFlow:h(g,e,a),elseFlow:h(p??[],e,a),queueOptions:s.queueOptions}]}if(j(n)){let{queue:s,vhost:l,errorQueue:p,inputMapping:g,outputMapping:m,errorMapping:o,queueParams:u,queueOptions:c}=n;return[{queue:s,vhost:l,inputMapping:g,outputMapping:m,errorMapping:o,nextFlow:a,errorQueue:p,queueParams:u,queueOptions:c}]}if(W(n)){let s=e[n.name];return typeof s=="string"?[{queue:s,inputMapping:{},outputMapping:{},errorMapping:{},nextFlow:a}]:[{queue:s.queue,vhost:s.vhost,inputMapping:s.inputMapping,outputMapping:s.outputMapping,errorMapping:s.errorMapping,errorQueue:s.errorQueue,queueParams:s.queueParams,nextFlow:a}]}if(ye(n)){let s=h(i,e,t);return n.map(l=>h(l,e,s)).reduce((l,p)=>p?l.concat(p):l,[])}}function C(r,e={}){return Object.keys(e).reduce((t,n)=>{let i=e[n];return Array.isArray(i)?{...t,[n]:i.map(a=>(0,$.default)(r,a))}:{...t,[n]:(0,$.default)(r,i)}},{})}function R(r,...e){let t=r,n=e;Y(r)&&(t=r.restFlow[0],n=[...r.restFlow.slice(1),...n]);let i=a=>({vhost:t.vhost,initQueue:t.queue,inputData:C(a.flowVariables,t.inputMapping),flowVariables:a.flowVariables,errorVariables:a.errorVariables,outputMapping:t.outputMapping,errorMapping:t.errorMapping,nextFlow:h(n,a.params),errorQueue:t.errorQueue,queueOptions:t.queueOptions});return i.restFlow=[r,...e],i}function k(r,e){return{type:"event",queue:r,vhost:e.vhost,inputMapping:e.inputMapping,outputMapping:e.outputMapping,errorMapping:e.errorMapping,queueParams:e.queueParams,queueOptions:e.queueOptions,onError(t){return{...this,errorQueue:t}}}}function Te(r){return{type:"param",name:r}}function Ee(r){return{type:"condition",...r}}function he(r,...e){let t=r?.restFlow??[];for(let n of e)t=[...t,...n.restFlow];return{type:"composition",restFlow:t}}function be(...r){function e(i){return Array.isArray(i)&&(j(i[0])||W(i[0]))}function t(i){return Array.isArray(i)&&!e(i)}return r.reduce((i,a)=>e(a)?i.concat([a]):t(a)?i.concat([a]):i.concat([[a]]),[])}var w=require("lodash"),Pe={passFlowVariables:!1,passErrorVariables:!0},we=parseInt(process.env.AMQP_CONSUMER_DEFAULT_PREFETCH||"")||15;function J(r,e,t){return e?Object.keys(e).reduce((n,i)=>{let a=e[i];if(Ae(a)){let s=a["$push"],l=n[s]??[];return l instanceof Array?{...n,[s]:[...l,(0,P.default)(t,i)]}:{...n}}else if(xe(a)){let s=a["$remove"],l=n[s]??[];return l instanceof Array?{...n,[s]:l.filter(p=>!(0,w.isEqual)(p,(0,P.default)(t,i)))}:{...n}}else{if(N(a))return{...n};if(Array.isArray(a)){let s=a.reduce((l,p)=>({...l,[p]:(0,P.default)(t,i)}),{});return{...n,...s}}return{...n,[a]:(0,P.default)(t,i)}}},r):r}function N(r){return(0,w.isObject)(r)&&!(r instanceof Array)}function Ae(r){return N(r)&&!!r["$push"]}function xe(r){return N(r)&&!!r["$remove"]}function X(r,e,t){return(r??[]).map(n=>{let i={inputData:C(e,n.inputMapping??{}),outputMapping:n.outputMapping,errorMapping:n.errorMapping,nextFlow:n.nextFlow,errorQueue:n.errorQueue,elseFlow:n.elseFlow,predicate:n.predicate,flowVariables:e,errorVariables:t};return{vhost:n.vhost,queue:n.queue,queueParams:C(e,n.queueParams??{}),event:i,queueOptions:n.queueOptions}})}async function H(r,e,t,n){try{let i=t.inputData,a=await Promise.resolve(e(i,{ack:n,publish:Ce(t)}))??{},s=J(t.flowVariables??{},t.outputMapping,a),l=J(t.errorVariables??{},t.errorMapping,a);return t.predicate&&!(0,P.default)(s,t.predicate)?X(t.elseFlow??[],s,l):X(t.nextFlow??[],s,l)}catch(i){return console.error(`Error in consumer "${r}"`),console.error(i),[{queue:t.errorQueue??"Error/General",event:{inputData:{queue:r,error:{message:i?.message,stack:i?.stack,data:i.data},event:t}}}]}}function Ce(r){return async({event:e,options:t=Pe,queueParams:n,vhost:i})=>{t?.passErrorVariables&&(e.errorVariables=(0,w.isObject)(e.errorVariables)?Object.assign(r.errorVariables??{},e.errorVariables):r.errorVariables??{}),t?.passFlowVariables&&(e.flowVariables=(0,w.isObject)(e.flowVariables)?Object.assign(r.flowVariables??{},e.flowVariables):r.flowVariables??{}),await T.publish({vhost:i,queue:e.initQueue,queueParams:n??{},event:e})}}async function V({queue:r,queueParams:e,prefetchValue:t=we,explicitAck:n=!1,doConnect:i=!1,vhost:a,callback:s,queueOptions:l}){await T.consume({queue:r,queueParams:e,prefetchValue:t,ack:!0,vhost:a,explicitAck:n,doConnect:i,queueOptions:l,callback:async(p,g)=>{console.info(`Consuming queue ${r}`);let m=await H(r,s,p,g?.ack);for(let o of m)await T.publish(o)}})}var ve=async(r,e,t)=>{let n,i;t?n=t:(n=await e.startSession(),n.startTransaction({readConcern:{level:"snapshot"},writeConcern:{w:1}}));try{i=await r(n)}catch(a){throw t||await n.abortTransaction(),new Error(`Error occurred during mongo session: ${a}`)}finally{t||(n.transaction.isActive&&await n.commitTransaction(),await n.endSession())}return i};var U={};q(U,{createActionExecutionData:()=>Me,createCodeContext:()=>ee});var Z=r=>({startTime:r.startTime,finishTime:r.finishTime,status:r.status,result:r?.twiddlebugResult?.result,errorCode:r?.twiddlebugResult?.errorCode,output:`${r?.twiddlebugResult?.result?JSON.stringify(r.twiddlebugResult.result)+`
`:""}${r?.twiddlebugResult?.stdout?r.twiddlebugResult.stdout+`
`:""}${r?.twiddlebugResult?.stderr?r.twiddlebugResult.stderr+`
`:""}`}),Se=(r,e)=>({usedPlugin:e,pluginAuthId:e.auth?.authId,method:r.method,params:r.params?.reduce((t,n)=>{let i=e.methods.find(a=>a.name===r.method)?.params?.find(a=>a.name===n.name)?.type;return{...t,[n.name]:{...n,type:i,resolved:!(n.code||i==="vault")}}},{}),pluginSettings:r.pluginSettings?.reduce((t,n)=>({...t,[n.name]:{...n,resolved:n.type!=="vault"}}),{}),pluginAccount:r.pluginAccount}),ee=({actions:r,actionResults:e=[],pipelineExecutionId:t,pipelineRevision:n,trigger:i,triggerPayload:a,configuration:s,inputs:l,configurations:p})=>{let g=r.reduce((m,o)=>{let u=e.filter(d=>d.actionId===o.uuid).pop(),c=u?Z(u):{};return{[o.codeId]:{id:o.codeId,name:o.name,mandatory:o.mandatory,retries:o.retries,timeout:o.timeout,plugin:o.usedPlugin&&{name:o.usedPlugin.name,version:o.usedPlugin.version},...c,executions:e.filter(d=>d.actionId===o.uuid).map(Z)},...m}},{});return{kaholo:{actions:g,pipeline:{id:n?.pipeline.id,name:n?.pipeline.name,configurations:p},execution:{id:t,inputs:l,agent:{name:n?.agent?.name,type:n?.agent?.type,dynamicOptions:n?.agent?.dynamicOptions},trigger:{message:i,payload:a},configuration:s}},actions:g}},Me=({actionExecutionId:r,pipelineExecutionId:e,actionId:t,pipelineId:n,agentKey:i,plugin:a,pipelineRevision:s,actionRevision:l,actionResults:p,trigger:g,triggerPayload:m,configuration:o,inputs:u,hash:c,configurations:d})=>({actionExecutionId:r,pipelineExecutionId:e,actionId:t,pipelineId:n,type:l.type,agentKey:i,condition:l.condition,preHook:l.preHook,postHook:l.postHook,retries:l.retries??0,timeout:l.timeout,pipelineRevision:s,hash:c,codeContext:ee({actions:s.actions,actionResults:p,pipelineExecutionId:e,pipelineRevision:s,trigger:g,triggerPayload:m,configuration:o,inputs:u,configurations:d}),...l.usedPlugin?Se(l,a):{params:l.params?.reduce((y,S)=>({...y,[S.name]:{...S,resolved:!(S.code||S.type==="vault")}}),{})}});var ne=require("uuid");var te=parseInt(process.env.RPC_REQUEST_TIMEOUT)||2e4,v=class extends Error{constructor({message:t,data:n}){super(t);Error.captureStackTrace&&Error.captureStackTrace(this,v),this.data=n,this.error=n.responseData?.error}};async function Oe(r,e){await T.unsubscribe({vhost:r,queue:"RPC/Response/{requestId}",queueParams:{requestId:e}}),await T.deleteQueue({vhost:r,queue:"RPC/Response/{requestId}",queueParams:{requestId:e}})}async function K({requestVhost:r="events",responseVhost:e="events",requestQueue:t,queueParams:n,requestData:i,retries:a=0}){let s=(0,ne.v4)(),l={expires:te,durable:!1},g=R(k(t,{vhost:r,inputMapping:{requestId:"requestId",requestData:"requestData"},outputMapping:{ok:"ok",responseData:"responseData"}}),k("RPC/Response/{requestId}",{vhost:e,queueParams:{requestId:"requestId"},inputMapping:{ok:"ok",responseData:"responseData"},queueOptions:l}))({flowVariables:{requestData:i,requestId:s},params:{}});return await T.publish({vhost:r,queue:t,queueParams:n,event:g}),new Promise((m,o)=>{let u=setTimeout(()=>{a?(console.info(`Retrying RPC request because of timeout (${a-1} left)} ${t}`),K({requestVhost:r,responseVhost:e,requestQueue:t,queueParams:n,requestData:i,retries:a-1}).then(m).catch(o)):o(new Error(`Timeout reached waiting for RPC response for ${t} request`))},te);V({vhost:e,queue:"RPC/Response/{requestId}",queueParams:{requestId:s},queueOptions:l,doConnect:!0,callback:c=>(clearTimeout(u),setTimeout(()=>{Oe(e,s).catch(d=>console.error("Error during RPC cleanup",d))},1e3),c.ok?m(c.responseData):a?(console.info(`Retrying RPC request because of error (${a-1} left) "${t}"`,c.responseData?.error),K({requestVhost:r,responseVhost:e,requestQueue:t,queueParams:n,requestData:i,retries:a-1}).then(m).catch(o)):o(new v({message:`Error in RPC response for ${t} request`,data:c})),{})}).catch(c=>{o(c),console.error("Error during RPC response consumer registration",c)})})}function De(r){return r&&new Date().valueOf()<new Date(r).valueOf()+1e4?"online":"offline"}function A(r,e){if(e?.nextStep){let t=x(r,e.nextStep);return A(r,t)}else return e?.type==="plugin"||e?.type==="code"?[e.id]:e?.type==="conditional"?[`${e.id}-end`]:e?.type==="actionGroup"?re(r,e):e?.type==="branching"?[`${e.id}-end`]:e?.type==="whileLoop"?[`${e.id}-startFalse`,`${e.id}-endFalse`]:[]}function re(r,e){let t=x(r,e.firstStep);return t?A(r,t):E(r,e.id)}function Fe(r,e){let t=x(r,e.onTrue),n=x(r,e.onFalse),i=t?A(r,t):[`${e.id}-onTrue`],a=n?A(r,n):[`${e.id}-onFalse`];return[...i,...a]}function ke(r,e){let t=e.branches?.filter(n=>n.nextStep).map(n=>A(r,x(r,n.nextStep)));return t?.length?t.flat():E(r,e.id)}function E(r,e){let t=r.find(i=>i.firstStep===e)||r.find(i=>i.onTrue===e)||r.find(i=>i.onFalse===e)||r.find(i=>i.loopStart===e)||r.find(i=>i.branches?.find(a=>a.nextStep===e));if(t?.type==="conditional")return t.onTrue===e?[`${t.id}-onTrue`]:[`${t.id}-onFalse`];if(t?.type==="whileLoop")return[`${t.id}-startTrue`];if(t)return E(r,t.id);let n=r.find(i=>i.nextStep===e);return n?n.type==="plugin"||n.type==="code"||n.type==="pipelineEnd"?[n.id]:n.type==="conditional"?[`${n.id}-end`]:n.type==="actionGroup"?re(r,n):n.type==="whileLoop"?[`${n.id}-startFalse`,`${n.id}-endFalse`]:n.type==="branching"?[`${n.id}-end`]:[]:["START"]}function x(r,e){return r.find(t=>t.id===e)}function Ve(r){function e(o){return{uuid:o.id,codeId:o.id,name:o.displayName,...o.description&&{description:o.description},flowControl:"each"}}function t(o){return{...e(o),timeout:o.timeout,retries:o.retries,agent:o.agent||null,usedPlugin:{name:o.plugin.split("@")[0],version:o.plugin.split("@")[1]},method:o.method,params:o.params.map(u=>({name:u.name,...u.required&&{required:u.required},code:u.code,value:u.value})),...o.mandatory&&{mandatory:o.mandatory},...o.pluginAccount&&{pluginAccount:o.pluginAccount}}}function n(o){return{...e(o),type:"clone",timeout:o.timeout,retries:o.retries,agent:o.agent||null,params:o.params.map(u=>({name:u.name,...u.required&&{required:u.required},code:u.code,value:u.value})),...o.mandatory&&{mandatory:o.mandatory}}}function i(o){return{...e(o),uuid:`${o.id}-end`,codeId:`${o.id}-end`,name:`${o.displayName}-end`,flowControl:"wait"}}function a(o){return{...e(o),preHook:o.code}}function s(o){return[{...e(o),uuid:`${o.id}-onTrue`,codeId:`${o.id}-onTrue`,name:`${o.id}-onTrue`,condition:o.condition?o.condition:"false",mandatory:!0},{...e(o),uuid:`${o.id}-onFalse`,codeId:`${o.id}-onFalse`,name:`${o.id}-onFalse`,condition:`!(${o.condition})`,mandatory:!0},{...e(o),uuid:`${o.id}-end`,codeId:`${o.id}-end`,name:`${o.displayName}-end`}]}function l(o){return[{...e(o),uuid:`${o.id}-startTrue`,codeId:`${o.id}-startTrue`,name:`${o.displayName}-startTrue`,condition:o.condition?o.condition:"false",mandatory:!0},{...e(o),uuid:`${o.id}-startFalse`,codeId:`${o.id}-startFalse`,name:`${o.displayName}-startFalse`,condition:`!(${o.condition})`,mandatory:!0},{...e(o),uuid:`${o.id}-endFalse`,codeId:`${o.id}-endFalse`,name:`${o.displayName}-endFalse`,condition:`!(${o.condition})`,mandatory:!0}]}function p(o){return{...e(o),type:"pipelineEnd"}}let{actions:g,links:m}=r.steps.reduce((o,u)=>{switch(u.type){case"plugin":{o.actions.push(t(u));let c=E(r.steps,u.id);for(let d of c)o.links.push({sourceId:d,targetId:u.id});break}case"clone":{o.actions.push(n(u));let c=E(r.steps,u.id);for(let d of c)o.links.push({sourceId:d,targetId:u.id});break}case"code":{o.actions.push(a(u));let c=E(r.steps,u.id);for(let d of c)o.links.push({sourceId:d,targetId:u.id});break}case"branching":{o.actions.push(i(u));let c=ke(r.steps,u);for(let d of c)o.links.push({sourceId:d,targetId:`${u.id}-end`});break}case"conditional":{o.actions.push(...s(u));let c=E(r.steps,u.id);for(let y of c)o.links.push({sourceId:y,targetId:`${u.id}-onTrue`}),o.links.push({sourceId:y,targetId:`${u.id}-onFalse`});let d=Fe(r.steps,u);for(let y of d)o.links.push({sourceId:y,targetId:`${u.id}-end`});break}case"whileLoop":{o.actions.push(...l(u));let c=E(r.steps,u.id);for(let y of c)o.links.push({sourceId:y,targetId:`${u.id}-startTrue`}),o.links.push({sourceId:y,targetId:`${u.id}-startFalse`});let d=A(r.steps,x(r.steps,u.loopStart));for(let y of d)o.links.push({sourceId:y,targetId:`${u.id}-startTrue`}),o.links.push({sourceId:y,targetId:`${u.id}-endFalse`});break}case"pipelineEnd":{o.actions.push(p(u));let c=E(r.steps,u.id);for(let d of c)o.links.push({sourceId:d,targetId:u.id});break}case"actionGroup":break;default:throw new Error(`Error during converting pipeline definition. Unsupported step type: "${u.type}"`)}return o},{actions:[],links:[]});return{actions:g,links:m}}var ie=require("child_process");async function qe(r,e,{failOnStatus:t=!0}={}){return new Promise((n,i)=>(0,ie.exec)(r,{shell:"/bin/bash",cwd:e},(a,s,l)=>{a&&t?(a.message=`
          Command executed with error: ${a.message}.
          stdout: ${s}
          stderr: ${l}`,i(a)):n({code:a?.code??0,stdout:s,stderr:l})}))}var oe={STATIC:"static",DYNAMIC:"dynamic",CLUSTER:"cluster"};0&&(module.exports={AgentTypeEnum,AmqpSdk,EventsWorker,VHOST,amqpSdk,calculateAgentState,eventsWorker,execCommand,executionDataHelper,flowConsumer,flowHelpers,flowInterpreter,getActionsAndLinks,rpcRequest,withTransaction});
