const DIST=require('path').resolve(__dirname,'../dist')+'/';
const fs=require('fs'),assert=require('assert'),vm=require('vm');
const root=(DIST+'');let receive,posted=[],html='',messages={};
const nodes={targetSummary:{},targetWarning:{},noSpellResults:{},weaponEmpty:{},messageDialog:{showModal(){}},messageTitle:{},messageBody:{}};
const ctx={UTL:require(root+'utl.js'),structuredClone,console,chrome:{webview:{addEventListener:(name,fn)=>receive=fn,postMessage:s=>posted.push(JSON.parse(s))}},localStorage:{getItem:()=>null,setItem(){}},document:{querySelectorAll:()=>[],getElementById:k=>k==='main'?{set innerHTML(s){html=s}}:nodes[k]},confirm:()=>true,alert(){}};vm.createContext(ctx);
for(const file of ['data.js','utl-data.js','desktop-bridge.js','io.js','app.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
(async()=>{
 assert(ctx.brolootDesktop);run("tab='Profile';render()");assert(!html.includes('download-app'));
 const original='UTL\r\n1\r\n0\r\n';let job=ctx.brolootDesktop.saveFile(original,'BroLoot.utl'),request=posted.pop();assert.equal(request.text,original);assert.equal(request.action,'saveFile');receive({data:{id:request.id,status:'saved',name:'BroLoot.utl',detail:'C:\\Loot\\BroLoot.utl'}});assert.equal((await job).status,'saved');
 let exporting=run('exportUTL()');request=posted.pop();assert(request.name.endsWith('.utl'));ctx.UTL.parse(request.text);assert(!run('profileMessage').includes('saved to'));receive({data:{id:request.id,status:'saved',name:request.name,detail:'C:\\Loot\\BroLoot.utl'}});await exporting;assert(run('profileMessage').includes('saved to C:\\Loot\\BroLoot.utl'));
 exporting=run('exportUTL()');request=posted.pop();receive({data:{id:request.id,status:'cancelled'}});await exporting;assert.equal(run('profileMessage'),'Save cancelled. No file was written.');
 exporting=run('exportUTL()');request=posted.pop();receive({data:{id:request.id,status:'error',detail:'Disk is full.'}});await exporting;assert.equal(nodes.messageBody.textContent,'Disk is full.');
 let settings=run('downloadSettings()');request=posted.pop();assert(request.name.endsWith('-settings.json'));assert.equal(JSON.parse(request.text).format,'BroLoot settings');receive({data:{id:request.id,status:'saved',name:request.name,detail:'C:\\Loot\\settings.json'}});await settings;
 const standalone=vm.createContext({});vm.runInContext(fs.readFileSync(root+'desktop-bridge.js','utf8'),standalone);assert(!standalone.brolootDesktop);
 console.log('PASS: native save handshake; exact CRLF payload; native export acknowledgment; cancellation; disk errors; JSON backup; no account/site initialization or desktop-only download link.');
})().catch(e=>{console.error(e);process.exitCode=1});
