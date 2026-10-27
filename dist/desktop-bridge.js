(function(root){
 'use strict';
 if(!root.chrome||!root.chrome.webview)return;
 const pending=new Map();let serial=0;
 root.chrome.webview.addEventListener('message',event=>{
  const result=event.data;
  if(!result||typeof result.id!=='string'||!pending.has(result.id))return;
  const job=pending.get(result.id);pending.delete(result.id);
  if(result.status==='error')job.reject(new Error(result.detail||'The file could not be saved.'));
  else if(result.status==='saved'||result.status==='cancelled')job.resolve(result);
  else job.reject(new Error('Unexpected desktop save response.'));
 });
 root.brolootDesktop={version:1,saveFile(text,name){return new Promise((resolve,reject)=>{
  const id='save-'+Date.now()+'-'+(++serial);pending.set(id,{resolve,reject});
  try{root.chrome.webview.postMessage(JSON.stringify({id,action:'saveFile',name,text}))}
  catch(error){pending.delete(id);reject(error)}
 })}};
})(globalThis);
