const fs=require('node:fs'), vm=require('node:vm'),assert=require('node:assert/strict');
const read=name=>fs.readFileSync(require('node:path').join(__dirname,'../web',name),'utf8');
class E{
 constructor(){this.children=[];}append(...v){this.children.push(...v);}add(v){this.append(v);}
 replaceChildren(...v){this.children=v;}setAttribute(k,v){this[k]=v;}getContext(){return {fillRect(){}};}
}
const ids={},handlers={},msgs=[];for(const m of read('template.html').matchAll(/id="(\w+)"/g))ids[m[1]]=new E();
const rt={window:{__JUCE__:{backend:{addEventListener:(n,fn)=>handlers[n]=fn,emitEvent:(_,m)=>{msgs.push(m);if(m.type==='ready')handlers.swInit({epoch:0});}}}},
 document:{getElementById:k=>ids[k],createElement:()=>new E()},Option:class{constructor(name,value){this.name=name;this.value=value;}},
 TextEncoder,btoa,crypto:require('node:crypto').webcrypto};
vm.createContext(rt);vm.runInContext(read('engine.js'),rt);vm.runInContext(read('app.js'),rt);
assert.equal(ids.lanes.children.length,6);
const state=()=>JSON.parse(msgs.filter(m=>m.type==='state').at(-1).json);
ids.mode.value=2;ids.mode.onchange();assert(ids.lanes.children[0].children[5].disabled);
ids.theme.value='Dark Score';ids.theme.onchange();ids.route.value='virtual';ids.route.onchange();
assert(state().midiData);const original=state().project;
ids.mel.onclick();let play=msgs.filter(m=>m.type==='play').at(-1);
assert(play.previewMidi&&play.length>0&&play.events.length);assert.deepEqual(state().project,original);
ids.mel.onclick();ids.prev.onclick();ids.apply.onclick();assert.equal(state().project.seed,original.seed);
assert.notEqual(state().project.melody,original.melody);ids.undo.onclick();assert.deepEqual(state().project,original);
ids.new.onclick();assert.notEqual(state().project.seed,original.seed);ids.chapters.children[3].onclick();ids.play.onclick();
play=msgs.filter(m=>m.type==='play').at(-1);assert(play.from>0);
ids.export.onclick();assert.equal(msgs.at(-1).data,state().midiData);
ids.save.onclick();const saved=Buffer.from(msgs.at(-1).data,'base64').toString();
handlers.swFile({data:saved});assert.deepEqual(state().project,JSON.parse(saved).project);
console.log('Verified editor routing, draft audition and commit, undo, sections, save and full export.');
