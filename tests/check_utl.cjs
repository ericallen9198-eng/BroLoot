const DIST=require('path').resolve(__dirname,'../dist')+'/';
const fs=require('fs'),assert=require('assert'),vm=require('vm');
const U=require((DIST+'utl.js')),docs=[];
for(const dir of fs.readdirSync('attachments'))for(const file of fs.readdirSync('attachments/'+dir))if(file.endsWith('.utl')){let raw=fs.readFileSync('attachments/'+dir+'/'+file,'utf8'),d=U.parse(raw);assert.equal(U.write(d),raw,file);docs.push({file,raw,d});assert.throws(()=>U.parse(raw.slice(0,-10)),/truncated|end/)}
assert.equal(docs.reduce((n,d)=>n+d.d.rules.length,0),1927);
const root=(DIST+'');let html='',alerts=[],stash={};const nodes={targetSummary:{},targetWarning:{},noSpellResults:{},weaponEmpty:{}};
const ctx={UTL:U,structuredClone,console,confirm:()=>true,alert:x=>alerts.push(x),localStorage:{getItem:k=>stash[k]||null,setItem:(k,v)=>stash[k]=v},document:{querySelectorAll:()=>[],getElementById:k=>k==='main'?{set innerHTML(s){html=s}}:nodes[k]},setTimeout};vm.createContext(ctx);
for(const name of ['data.js','utl-data.js','io.js','app.js'])vm.runInContext(fs.readFileSync(root+name,'utf8'),ctx);
const run=code=>vm.runInContext(code,ctx);
// Generated export is framed correctly and can restore the entire editor state.
let built=run('buildProfile()');assert.equal(U.parse(built.text).rules.length,built.doc.rules.length);assert.equal(U.readSettings(U.parse(built.text)).reserve,5);assert.equal(run('state.serverItems.length'),45);
assert.equal(run('state.materials.length'),72);
for(const r of built.doc.rules.filter(r=>r.action>0&&!U.disabled(r))){let p=r.requirements.filter(q=>q.type===1001).map(q=>+U.parts(q)[0]);assert.equal(p.length,1);assert(p[0]>=6)}
// CD and CDR remain alternative rules, rather than an impossible conjunction.
const target={name:'Attributes',enabled:true,spells:['Strength','Focus'],tiers:['Legendary'],sets:[],count:1,cd:2,cdr:2,vitality:0};
let rr=U.compileTarget('Underclothes',target,['Strength','Focus']);assert.equal(rr.length,2);for(const r of rr)assert.equal(r.requirements.filter(q=>q.type===3&&['374','375'].includes(U.parts(q)[1])).length,1);
const pat=new RegExp(U.parts(rr[0].requirements.find(q=>q.type===9))[0]);assert(pat.test('Legendary Strength'));assert(!pat.test('Epic Strength'));assert.equal(U.parts(rr[0].requirements.find(q=>q.type===9))[1],'');
let jewelry=U.compileTarget('Jewelry',{...target,spells:['War Magic Aptitude'],vitality:3,cd:0,cdr:0},['War Magic Aptitude']);assert.equal(jewelry.length,1);assert(jewelry[0].requirements.some(q=>U.parts(q)[1]==='379'));assert(!jewelry[0].requirements.some(q=>['374','375','265'].includes(U.parts(q)[1])));
assert.throws(()=>U.compileTarget('Jewelry',{...target,spells:['Acid Bane']},['Acid Bane']),/armor-only/);
// Pack reserve uses >N before looting: at N slots no item may consume the reserve.
let original={name:'Opaque',expression:'',priority:0,action:1,quantity:null,requirements:[U.req(12345,'unknown\r\nvalue'),U.req(1001,12)]};let packed=U.withPackspace(original,5);assert.equal(+U.parts(packed.requirements.find(q=>q.type===1001))[0],12);assert.equal(packed.requirements[0].data,original.requirements[0].data);
// Material range, per-material historical pack constraints, and unknown extensions survive.
let salvage=U.salvageRule({name:'Iron',enabled:true,minimum:7,maximum:9,packMinimum:8},61);assert(salvage.requirements.some(q=>q.type===2&&U.parts(q)[0]==='9'));assert(salvage.requirements.some(q=>q.type===1001&&U.parts(q)[0]==='8'));
let unknown={version:1,rules:[original],extras:[{name:'UnknownPlugin',data:'\u2603\r\nopaque\r\n'}]};let unknownText=U.write(unknown);assert.equal(U.write(U.parse(unknownText)),unknownText);
// All 253 weapon templates across four profiles retain original non-damage requirements.
for(const d of docs){let key=d.file.replace('DreamWeave-','').replace('.utl','');ctx.key=key;let rows=run('DATA.profiles[key]'),templates=run('UTLDATA.weapons[key]');for(const w of rows){let template=templates.find(t=>t.name===w.source);assert(template);let updated=U.compileWeapon({...w,minimum:w.minimum+0.5},template);let q=updated.requirements.find(q=>[2001,2003,2005].includes(q.type));assert.equal(+U.parts(q)[0],w.minimum+0.5);assert.deepEqual(updated.requirements.filter(q=>![2001,2003,2005,9999].includes(q.type)),template.requirements.filter(q=>![2001,2003,2005,9999].includes(q.type)))}}
// External import preserves all original rule semantics and ordering, without enabling new broad targets.
for(const fixture of docs){ctx.doc=fixture.d;ctx.fname=fixture.file;run('state=importedState(doc,fname);initIO()');assert.equal(run('state.Armor.filter(t=>t.enabled).length'),0);let sourceNames=run('state.importedRules.map(e=>e.rule.name)');assert.deepEqual(Array.from(sourceNames),fixture.d.rules.filter(r=>!r.name.startsWith('(DW)')&&r.name!=='DreamWeave rare').map(r=>r.name));let exported=run('buildProfile()');assert.deepEqual(exported.doc.rules.map(r=>r.name.replace(/^\[NoobLoot\] Server: /,'')),fixture.d.rules.filter(r=>!(r.name.startsWith('(DW)')||r.name==='DreamWeave rare')||!U.disabled(r)).map(r=>r.name));let restored=U.readSettings(U.parse(exported.text));assert.equal(restored.sourceFile,fixture.file);assert.equal(restored.importedRules.length,sourceNames.length);ctx.restored=restored;run('state=validateSnapshot(restored);initIO()');assert.equal(run('state.sourceFile'),fixture.file)}
run("tab='Profile';render();tab='DreamWeave';render();tab='Imported';render()");
// Conversion moves only simple, unambiguous salvage rules and keeps stricter historical pack limits.
ctx.doc=docs.find(d=>d.file.includes('v3')).d;run("state=importedState(doc,'sample.utl');useSalvageControls()");assert(run('state.materials.some(m=>m.enabled)'));let converted=run('state.materials.find(m=>m.enabled)');assert(converted.packMinimum>=7);built=run('buildProfile()');assert(U.parse(built.text));
console.log('PASS: 1,927 original rules round-trip exactly; generated UTL framing; inclusive spells; rating alternatives; Vitality 379; pack reserve boundaries; 253 weapon templates; unknown data; complete state restoration; explicit salvage conversion.');

(async()=>{
 nodes.messageTitle={};nodes.messageBody={};nodes.messageDialog={showModal(){}};
 ctx.mockFile={name:'example.utl',size:docs[0].raw.length,text:async()=>docs[0].raw};
 await run('importFile(mockFile)');assert.equal(run('state.sourceFile'),'example.utl');
 const prior=run('JSON.stringify(state)');ctx.confirm=()=>false;ctx.mockFile={name:'cancelled.utl',size:docs[1].raw.length,text:async()=>docs[1].raw};await run('importFile(mockFile)');assert.equal(run('JSON.stringify(state)'),prior);ctx.confirm=()=>true;
 ctx.mockFile={name:'broken.utl',size:10,text:async()=>'UTL\r\n1\r\n5'};await run('importFile(mockFile)');assert.equal(run('JSON.stringify(state)'),prior);assert.equal(nodes.messageTitle.textContent,'Could not open profile');
 let saved=run('buildProfile().text');ctx.mockFile={name:'NoobLoot.utl',size:saved.length,text:async()=>saved};await run('importFile(mockFile)');assert.equal(run('state.sourceFile'),'example.utl');
 ctx.Blob=Blob;ctx.URL={createObjectURL:b=>{ctx.lastBlob=b;return 'blob:test'},revokeObjectURL(){}};ctx.setTimeout=fn=>fn();ctx.document.body={appendChild(){}};ctx.document.createElement=()=>({click(){ctx.downloadedName=this.download},remove(){}});
 run('exportUTL()');assert(ctx.downloadedName.endsWith('.utl'));const exported=await ctx.lastBlob.text();assert(U.parse(exported).rules.length>0);
 console.log('PASS: browser import flow, cancel without mutation, damaged-file rejection without mutation, own-UTL state restoration, and export download.');
})().catch(e=>{console.error(e);process.exitCode=1});
