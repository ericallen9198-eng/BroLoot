/* UTL v1 framing verified against the uploaded VTClassic.dll Read/Write methods.
   Requirements and extension blocks are UTF-16 character-counted, including CRLF.
   Unknown payloads stay opaque. No imported expression or metadata is evaluated. */
(function(root){'use strict';
const NL='\r\n',MAX=16*1024*1024;
const CLOAKS=typeof module!=='undefined'&&module.exports?require('./cloak-data.js'):CLOAK_DATA;
function error(message){throw new Error(message)}
function integer(value,label,min=0,max=10000000){if(!/^-?\d+$/.test(String(value))||!Number.isSafeInteger(+value)||+value<min||+value>max)error('Invalid '+label+'.');return +value}
function parse(text){if(typeof text!=='string'||text.length>MAX)error('Choose a UTL smaller than 16 MB.');let pos=text.charCodeAt(0)===0xfeff?1:0,bom=pos===1;
 function line(){if(pos>=text.length)error('Unexpected end of UTL file.');let end=text.indexOf('\n',pos);if(end<0){let v=text.slice(pos);pos=text.length;return v.replace(/\r$/,'')}let v=text.slice(pos,end).replace(/\r$/,'');pos=end+1;return v}
 function payload(n){n=integer(n,'payload length',0,MAX);if(pos+n>text.length)error('A UTL payload is truncated.');const p=text.slice(pos,pos+n);pos+=n;return p}
 if(line()!=='UTL')error('This is not a UTL file.');if(line()!=='1')error('Only UTL version 1 is supported.');const count=integer(line(),'rule count',0,100000),rules=[];
 for(let i=0;i<count;i++){let start=pos,name=line(),expression=line(),header=line().split(';');if(header.length<2)error('Missing rule header at '+name+'.');let priority=integer(header[0],'priority',-2147483648,2147483647),action=integer(header[1],'loot action',0,2147483647),quantity=action===10?integer(line(),'keep quantity',0,2147483647):null,requirements=[];
 for(const type of header.slice(2)){let id=integer(type,'requirement type',0,2147483647),n=line();requirements.push({type:id,data:payload(n)})}
 rules.push({name,expression,priority,action,quantity,requirements,raw:text.slice(start,pos)})}
 const extras=[];while(pos<text.length){if(!text.slice(pos).trim()){pos=text.length;break}let start=pos,name=line(),data=payload(line());extras.push({name,data,raw:text.slice(start,pos)})}return {version:1,bom,rules,extras}}
function field(value,label){value=String(value??'');if(/[\r\n]/.test(value))error(label+' cannot contain a line break.');return value}
function writeRule(r){if(r.raw)return r.raw;let out=field(r.name,'Rule name')+NL+field(r.expression,'Expression')+NL+[r.priority??0,r.action,...r.requirements.map(q=>q.type)].join(';')+NL;if(r.action===10)out+=integer(r.quantity,'keep quantity',0,2147483647)+NL;for(const q of r.requirements)out+=q.data.length+NL+q.data;return out}
function write(doc){let out=(doc.bom?'\ufeff':'')+'UTL'+NL+'1'+NL+doc.rules.length+NL+doc.rules.map(writeRule).join('');for(const b of doc.extras||[])out+=b.raw??(field(b.name,'Extension name')+NL+b.data.length+NL+b.data);if(out.length>MAX)error('The exported profile exceeds 16 MB.');return out}
function parts(q){return q.data.replace(/\r?\n$/,'').split(/\r?\n/)}
function req(type,...values){return {type,data:values.join(NL)+NL}}
function clone(r){let out=JSON.parse(JSON.stringify(r));delete out.raw;return out}
function disabled(r){return r.requirements.some(q=>q.type===9999&&parts(q)[0]==='true')}
function withPackspace(r,reserve){r=clone(r);if(r.action===0||disabled(r))return r;const required=integer(reserve,'free pack-space reserve',0,1000)+1;let original=0;r.requirements=r.requirements.filter(q=>{if(q.type!==1001)return true;original=Math.max(original,integer(parts(q)[0],'pack-space requirement',0,2147483647));return false});r.requirements.push(req(1001,Math.max(original,required)));return r}
function unbrandedName(name){return name.replace(/^\[(?:NoobLoot|BroLoot)\]\s*(?:Server:\s*)?/,'')}
function enabledRule(r,on){r=clone(r);r.name=unbrandedName(r.name);if(!on&&!disabled(r))r.requirements.push(req(9999,'true'));return r}
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
const SETS={Adept:14,Defender:16,Dexterous:20,Hearty:19,Dedication:30,'Flame Proof':26,'Acid Proof':27,'Cold Proof':28,'Lightning Proof':29};
const CATEGORIES=['Armor','Underclothes','Jewelry','Trinkets','Cloaks'];
const RATINGS={
 damage:{label:'Damage',short:'D',property:370,referenceMax:3},
 damageResist:{label:'Damage resist',short:'DR',property:371,referenceMax:3},
 cd:{label:'Critical damage',short:'CD',property:374,referenceMax:2},
 cdr:{label:'Critical damage resist',short:'CDR',property:375,referenceMax:2},
 vitality:{label:'Max health / Vitality',short:'V',property:379,referenceMax:3},
 healing:{label:'Healing boost',short:'H',property:376,referenceMax:3}
};
function primaryRatings(category){return category==='Armor'?['cd','cdr']:['Underclothes','Cloaks'].includes(category)?['damage','damageResist']:['vitality','healing']}
function ratingDefaults(t){return Object.assign(Object.fromEntries(Object.keys(RATINGS).map(k=>[k,0])),t)}
function insensitiveLiteral(text){return escapeRegex(text).replace(/[a-z]/gi,c=>'['+c.toLowerCase()+c.toUpperCase()+']').replace(/'/g,"['’]")}
function cloakRequirements(t){const level=integer(t.cloakLevel??0,'cloak level potential',0,5),set=integer(t.cloakSet??0,'cloak set',0,10000),proc=CLOAKS.procs[t.cloakProc||'any'];if(set&&!Object.values(CLOAKS.sets).includes(set))error('Unknown cloak set.');if(!proc)error('Unknown cloak proc.');let rules=[req(11,0x08000000,218103822)];if(level)rules.push(req(3,27700+level-1,218103849));if(set)rules.push(req(12,set,265));if(t.cloakNamePattern)rules.push(req(1,t.cloakNamePattern,1));if(t.packMinimum)rules.push(req(1001,t.packMinimum));if(proc.kind==='damage')rules.push(req(12,2,352));if(proc.kind==='spell'){rules.push(req(12,1,352));if(proc.names)rules.push(req(9,'^(?:'+proc.names.map(insensitiveLiteral).join('|')+')$','',1))}return rules}
function compileTarget(category,t,catalog){if(!t.enabled)return [];if(!CATEGORIES.includes(category))error('Unknown equipment category.');t=ratingDefaults(t);integer(t.count,'minimum matching cantrips',0,100);const names=t.spells.filter(s=>catalog.includes(s));let spell=null;
 if(t.count>0){if(names.length!==t.spells.length||!names.length||!t.tiers.length)error('Choose cantrips and tiers for '+t.name+'.');if(t.tiers.some(s=>!['Minor','Major','Epic','Legendary'].includes(s)))error('Invalid cantrip tier.');integer(t.count,'minimum matching cantrips',1,names.length*t.tiers.length);if(['Jewelry','Trinkets','Cloaks'].includes(category)&&names.some(s=>/ Bane$|^Impenetrability$|^(Strength|Endurance|Coordination|Quickness|Focus|Willpower)$/.test(s)))error(category+' contains an armor-only cantrip.');if(category!=='Armor'&&names.some(s=>/ Bane$|^Impenetrability$/.test(s)))error('Banes belong on armor.');
 const pattern='^(?:'+t.tiers.map(escapeRegex).join('|')+') (?:'+names.map(escapeRegex).join('|')+')$';spell=req(9,pattern,'',t.count)}
 for(const [key,info] of Object.entries(RATINGS))integer(t[key],info.label,0,100);
 const ratings=Object.entries(RATINGS).filter(([key])=>t[key]>0).map(([key,info])=>({key,info,requirement:req(3,integer(t[key],info.label,1,100),info.property)}));if(!ratings.length)ratings.push(null);
 const chosenSets=category==='Armor'&&t.sets.length?t.sets:[null];const variants=category==='Armor'?[2,3]:[category==='Jewelry'?4:category==='Trinkets'?null:3];const rules=[];
 for(const set of chosenSets){if(set&&!SETS[set])error('Unknown armor set: '+set);for(const objectClass of variants)for(const rating of ratings){let requirements=objectClass===null?[]:[req(7,objectClass)];
 // ValidLocations flags separate worn jewelry from trinkets. Type 11 matches ANY flagged slot.
 if(category==='Jewelry')requirements.push(req(11,0x000F8000,218103822));if(category==='Trinkets')requirements.push(req(11,0x04000000,218103822));if(category==='Cloaks')requirements.push(...cloakRequirements(t));
 if(category==='Armor'&&objectClass===3)requirements.push(req(3,1,28));if(category==='Underclothes')requirements.push(req(2,0,28),req(13,0x08000000,218103822));if(set)requirements.push(req(12,SETS[set],265));if(spell)requirements.push(spell);if(rating)requirements.push(rating.requirement);
 rules.push({name:category+': '+field(t.name,'Target name')+(set?' / '+set:'')+(rating?' / '+rating.info.short+' '+t[rating.key]:''),expression:'',priority:0,action:1,quantity:null,requirements})}}
 return rules}
function compileWeapon(w,template){if(!w.enabled)return null;if(w.maximum!==''&&w.maximum!=null)error('The original UTL engine supports minimum buffed damage, not an upper buffed-damage cap. Clear the optional maximum for '+w.kind+'.');let r=clone(template),q=r.requirements.find(q=>[2001,2003,2005].includes(q.type));if(!q)error('Missing original weapon template for '+w.kind+'.');let minimum=Number(w.minimum);if(!Number.isFinite(minimum)||minimum<0)error('Invalid damage threshold for '+w.kind+'.');let p=parts(q);p[0]=String(minimum);q.data=p.join(NL)+NL;r.requirements=r.requirements.filter(q=>q.type!==9999);r.name=w.family+' '+w.kind+' / '+w.wield+' / minimum '+minimum;return r}
function salvageRule(m,id){if(!m.enabled)return null;integer(m.minimum,'minimum workmanship',1,10);integer(m.maximum,'maximum workmanship',m.minimum,10);if(!id)error('Unknown salvage material '+m.name+'.');return {name:'Salvage: '+m.name,expression:'',priority:0,action:2,quantity:null,requirements:[req(12,id,131),req(3,m.minimum,105),req(2,m.maximum,105),...(m.packMinimum?[req(1001,m.packMinimum)]:[])]}}
function serverRule(entry){if(!entry.enabled)return null;let r=clone(entry.rule);r.name=unbrandedName(r.name);r.requirements=r.requirements.filter(q=>q.type!==9999);r.action=entry.quantity>0?10:1;r.quantity=r.action===10?integer(entry.quantity,'keep quantity',1,2147483647):null;return r}
function combineBlock(materials,ids,previous){let def='1-6, 7-8, 9, 10',map={},values=[];if(previous){let ls=previous.data.trimEnd().split(/\r?\n/),i=0;integer(ls[i++],'salvage extension version',1,1);def=ls[i++];let count=integer(ls[i++],'material combine count',0,10000);for(let j=0;j<count;j++)map[ls[i++]]=ls[i++];let n=i<ls.length?integer(ls[i++],'value-combine count',0,10000):0;for(let j=0;j<n;j++)values.push([ls[i++],ls[i++]])}
 for(const m of materials)if(ids[m.name])map[ids[m.name]]=m.combine.replaceAll('–','-');let entries=Object.entries(map),lines=['1',def,String(entries.length)];for(const [id,ranges] of entries)lines.push(id,ranges);lines.push(String(values.length));for(const v of values)lines.push(...v);return {name:'SalvageCombine',data:lines.join(NL)+NL}}
function compile(state,data,templates){let rules=[],targets=[];
 for(const cat of CATEGORIES)for(const t of state[cat])targets.push(...compileTarget(cat,t,data.spells));for(const w of state.weapons){let template=w.template||templates.weapons[state.weaponPreset]?.find(t=>t.name===w.source);if(!template)error('Missing weapon source for '+w.source);let r=compileWeapon(w,template);if(r)targets.push(r)}
 const ordered=[];if(state.custom)for(const e of state.serverItems||[]){let r=serverRule(e);if(r){if(Number.isInteger(e.order))ordered.push({rule:r,order:e.order,group:'Server'});else rules.push(r)}}
 for(const [i,e] of (state.importedRules||[]).entries())ordered.push({rule:enabledRule(e.rule,e.enabled),order:Number.isInteger(e.order)?e.order:i,group:e.group});ordered.sort((a,b)=>a.order-b.order);
 // Retained rules, including custom items, preserve their relative order. New equipment
 // targets enter before the first legacy equipment/salvage rule, after earlier protections.
 let inserted=false;for(const e of ordered){if(!inserted&&[...CATEGORIES,'Weapons','Salvage'].includes(e.group)){rules.push(...targets);inserted=true}rules.push(e.rule)}if(!inserted)rules.push(...targets);
 for(const m of state.materials){let r=salvageRule(m,templates.materialIds[m.name]);if(r)rules.push(r)}rules=rules.map(r=>withPackspace(r,state.reserve));
 const extra=(state.importedExtras||[]).filter(e=>e.name!=='NoobLootSettings'&&e.name!=='SalvageCombine').map(e=>JSON.parse(JSON.stringify(e)));extra.push(combineBlock(state.materials,templates.materialIds,(state.importedExtras||[]).find(e=>e.name==='SalvageCombine')));extra.push({name:'NoobLootSettings',data:JSON.stringify({schema:1,settings:state})+NL});return {version:1,bom:false,rules,extras:extra}}
function readSettings(doc){let b=doc.extras.find(b=>b.name==='NoobLootSettings');if(!b)return null;let value;try{value=JSON.parse(b.data)}catch(e){error('BroLoot settings in this file are damaged.')}if(value.schema!==1||!value.settings||typeof value.settings!=='object')error('Unsupported BroLoot settings version.');return value.settings}
const api={parse,write,parts,req,clone,disabled,withPackspace,enabledRule,CLOAKS,cloakRequirements,CATEGORIES,RATINGS,primaryRatings,ratingDefaults,compileTarget,compileWeapon,salvageRule,serverRule,combineBlock,compile,readSettings,SETS};root.UTL=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
