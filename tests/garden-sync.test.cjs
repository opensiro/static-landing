const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(require('node:path').join(__dirname, '../vines.js'), 'utf8');

// Small DOM adapter for exercising the real animation clock and page lifecycle.
class Element {
  constructor(tag) {
    this.tag = tag; this.attrs = {}; this.children = []; this.listeners = {};
    this.style = {setProperty() {}};
    this.classList = {add() {}, toggle() {}};
  }
  setAttribute(k,v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  appendChild(el) { el.parent = this; this.children.push(el); }
  replaceChildren() { this.children = []; }
  remove() { this.parent.children = this.parent.children.filter(el => el !== this); }
  addEventListener(name,fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name) { (this.listeners[name] || []).forEach(fn => fn({})); }
}
function page(store, reduced = false) {
  const hero = new Element('section'), host = new Element('div');
  const pause = new Element('button'), controls = new Element('div');
  hero.querySelector = s => ({'.vine-center':host,'.vine-controls':controls,'.vine-pause':pause})[s];
  const win = new Element('window'), doc = new Element('document');
  doc.querySelector = () => hero;
  doc.createElementNS = (_,tag) => new Element(tag);
  doc.hidden = false;
  const motion = new Element('media'); motion.matches = reduced;
  win.matchMedia = () => motion;
  let clock = 0, frameId = 0;
  const frames = new Map();
  vm.runInNewContext(code, {document:doc,window:win,sessionStorage:store,
    requestAnimationFrame:fn => { frames.set(++frameId,fn); return frameId; },
    cancelAnimationFrame:id => frames.delete(id)});
  function frame() { const current = [...frames.values()]; frames.clear(); current.forEach(fn => fn(clock)); }
  frame();
  return {win, pause, controls, motion,
    advance(ms) { const target=clock+ms; while(clock<target) {clock=Math.min(target,clock+80);frame();} },
    image() {
      function walk(el) {return [el.tag,Object.fromEntries(Object.entries(el.attrs).filter(([k])=>k!=='class').map(([k,v])=>[k,k==='viewBox'?v.split(' ').map(Number).join(' '):v]).sort()),el.children.map(walk)];}
      return JSON.stringify(host.children.map(walk));
    },
    frameCount:() => frames.size,
    camera:() => host.children[0].attrs.viewBox
  };
}
function storage(initial = null) { let value=initial; return {getItem:()=>value,setItem:(_,v)=>value=v}; }

for (const age of [80,100,2898,4032,4160,4800,5200,12500,16000,45000]) {
  const store=storage(), a=page(store);
  a.advance(age); a.pause.emit('click'); a.win.emit('pageswap'); a.win.emit('pagehide');
  const b=page(store);
  assert(b.image()===a.image(),`same geometry at ${age} ms`);
  assert.equal(b.camera(),a.camera());
  assert.equal(b.pause.textContent,'Resume');
  assert.equal(b.frameCount(),0);
  b.pause.emit('click'); b.advance(1800); b.pause.emit('click'); b.win.emit('pagehide');
  a.win.emit('pageshow');
  assert(a.image()===b.image(),`bfcache keeps latest growth at ${age} ms`);
}
const boundedStore=storage(), longPage=page(boundedStore);
longPage.advance(600000); longPage.win.emit('pagehide');
const snapshot=JSON.parse(boundedStore.getItem());
assert(snapshot.chunks.length<=40);
assert(boundedStore.getItem().length<30000);
assert(page(boundedStore).image()===longPage.image(),'long session restored exactly');
console.log(`10-minute garden: ${snapshot.chunks.length} live sections, ${boundedStore.getItem().length} saved bytes`);
for(const store of [storage('{broken'),storage('{"version":1,"time":5}'),{getItem(){throw Error('denied');},setItem(){throw Error('denied');}}]) {
  const a=page(store); a.advance(1000); a.pause.emit('click'); a.win.emit('pagehide');
  assert(a.image().includes('data-vine-profile'));
}
const stillStore=storage(), still=page(stillStore,true);
assert(still.controls.hidden); assert.equal(still.frameCount(),0);
still.win.emit('pagehide');
assert(page(stillStore,true).image()===still.image(),'reduced-motion restoration');
console.log('PASS: growth/flower round trips, pause, bfcache, bounded history, bad/unavailable storage, reduced motion');
