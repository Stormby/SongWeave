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
ids.lib.value='ERA II Vocal Codex';ids.lib.onchange();
ids.style.value='10';ids.style.onchange();
assert(ids.lanes.children[0].children[1].textContent.includes('Celtia'));
ids.route.value='virtual';ids.route.onchange();
const state=()=>JSON.parse(msgs.filter(m=>m.type==='state').at(-1).json);
assert(state().midiData);ids.chapters.children[3].onclick();assert.equal(state().scope,2);
ids.play.onclick();assert.equal(msgs.at(-1).from,1200*480);assert.equal(msgs.at(-1).length,600*480);ids.play.onclick();
ids.export.onclick();assert(msgs.at(-1).data);const before=state().project;
ids.new.onclick();assert.equal(state().project.style,10);ids.undo.onclick();assert.deepEqual(state().project,before);
handlers.swInit({epoch:1,state:JSON.stringify(state())});assert.equal(ids.route.value,'virtual');
console.log('Editor: library/style, instrument display, routed MIDI, chapter preview and export, regenerate/undo, restore passed.');

const accepted=JSON.stringify(state().project);
ids.leadStyle.value='5';ids.leadStyle.onchange();ids.instrument.value='tagel';ids.instrument.onchange();
ids.generate.onclick();assert.equal(msgs.at(-1).length,45*480);assert(msgs.at(-1).previewMidi);
const first=msgs.at(-1).previewMidi;ids.generate.onclick();assert.notEqual(msgs.at(-1).previewMidi,first);
ids.previous.onclick();assert.equal(msgs.at(-1).previewMidi,first);assert.equal(JSON.stringify(state().project),accepted);
ids.octave.value='1';ids.octave.onchange();ids.apply.onclick();assert.equal(state().project.lead.oct,1);
assert.equal(state().project.lead.id,'tagel');assert.equal(state().project.lead.style,5);
console.log('Draft audition, previous take, octave and commit passed.');
