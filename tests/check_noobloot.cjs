const DIST=require('path').resolve(__dirname,'../dist')+'/';
const fs=require('fs'),vm=require('vm'),assert=require('assert');let html='',stash={},alerts=[];
const nodes={targetSummary:{},targetWarning:{},noSpellResults:{},weaponEmpty:{}};
const ctx={UTL:require((DIST+'utl.js')),document:{querySelectorAll:()=>[],getElementById:k=>k==='main'?{set innerHTML(v){html=v}}:nodes[k]},localStorage:{getItem:k=>stash[k]||null,setItem:(k,v)=>stash[k]=v},alert:m=>alerts.push(m),confirm:()=>true,structuredClone,console};vm.createContext(ctx);vm.runInContext(fs.readFileSync((DIST+'data.js'),'utf8'),ctx);for(const file of ['utl-data.js','io.js','app.js'])vm.runInContext(fs.readFileSync((DIST+'')+file,'utf8'),ctx);
function run(code){return vm.runInContext(code,ctx)}
assert.equal(run('new Set(Object.values(groups).flat()).size'),60);
run("tab='Armor';render();toggle('spells','War Magic Aptitude',true);toggle('spells','Void Magic Aptitude',true)");assert(nodes.targetSummary.textContent.includes('War Magic Aptitude'));assert(nodes.targetSummary.textContent.includes('Void Magic Aptitude'));
run("toggle('tiers','Minor',true);update('count',2);duplicate()");assert.equal(run('state.Armor.length'),2);run("toggle('spells','War Magic Aptitude',false)");assert(run('state.Armor[0].spells.includes("War Magic Aptitude")'));run('remove()');
run("tab='Jewelry';selected=0;render();update('vitality',3)");assert(html.includes('Minimum Max health / Vitality'));assert(!html.includes('Minimum CD'));assert(!html.includes('Sets ·'));assert(nodes.targetSummary.textContent.includes('V ≥ 3'));assert(!html.includes('data-group="Attributes"'));
run("tab='Weapons';render()");assert(html.includes('1.15'));assert(!html.includes('OPTIONAL MAX'));assert.equal(run('state.weapons.length'),51);
run("weapon(0,'minimum','80');weapon(0,'maximum','75')");assert.equal(run('state.weapons[0].minimum'),80);assert.equal(run('state.weapons[0].maximum'),'');assert(alerts.length);
run("preset('Beginner')");assert.equal(run('state.weapons.length'),100);assert.equal(run("state.weapons.find(w=>w.kind==='War wand').minimum"),1.03);
assert.equal(run("validRanges('1–6, 7–8, 9, 10')"),true);assert.equal(run("validRanges('1–6, 5–8')"),false);assert.equal(run("validRanges('1–11')"),false);
assert(stash['noobloot-preview-v2']);
run("tab='Jewelry';selected=0;render()");assert(!html.includes('data-value="Acid Bane"'));assert(!html.includes('data-value="Impenetrability"'));assert(html.includes('data-value="Magic Resistance"'));assert(html.includes('data-value="Invulnerability"'));assert(html.includes('data-value="Impregnability"'));assert(html.includes('data-value="Armor"'));assert(!html.includes('Only wards'));
run("toggle('spells','Acid Bane',true)");assert(!run("target().spells.includes('Acid Bane')"));
run("tab='Armor';selected=0;render()");assert(html.includes('data-value="Impenetrability"'));assert(html.includes('All attributes'));assert(!html.includes('Only all attributes'));
assert(run("matchesCantripRequirement({...fresh('test'),cd:2},[{name:'Strength',tier:'Legendary'},{name:'War Magic Aptitude',tier:'Legendary'}])"));
assert(!run("matchesCantripRequirement(fresh('test'),[{name:'War Magic Aptitude',tier:'Legendary'}])"));
assert(!run("matchesCantripRequirement({...fresh('test'),count:2},[{name:'Strength',tier:'Legendary'},{name:'War Magic Aptitude',tier:'Legendary'}])"));
assert(run("matchesCantripRequirement({...fresh('test'),count:2},[{name:'Strength',tier:'Legendary'},{name:'Focus',tier:'Legendary'},{name:'War Magic Aptitude',tier:'Legendary'}])"));
assert(!run("matchesCantripRequirement(fresh('test'),[{name:'Strength',tier:'Epic'}])"));
// Earlier preview settings migrate without losing attribute choices or pack reserve.
const previous=JSON.stringify({Underclothes:[{name:'Existing target',attrs:['STR','FOCUS'],tiers:['Major'],count:1,cd:2,cdr:0,enabled:true,sets:[]}],reserve:9});stash={'lootwork-preview':previous};const migrated=vm.createContext({...ctx});vm.runInContext(fs.readFileSync((DIST+'data.js'),'utf8'),migrated);for(const file of ['utl-data.js','io.js','app.js'])vm.runInContext(fs.readFileSync((DIST+'')+file,'utf8'),migrated);assert.equal(vm.runInContext('state.reserve',migrated),9);assert.equal(vm.runInContext('state.Underclothes[0].spells.join(",")',migrated),'Strength,Focus');
console.log('PASS: complete cantrip coverage, spell/tier targets, independent copies, jewelry ratings, 151 profile thresholds, range validation, persistence, and old-settings migration.');
