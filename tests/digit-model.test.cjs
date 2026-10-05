const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const root=path.resolve(__dirname,'..');const model=require('../docs/digit-model.js');
const weights=model.validate(JSON.parse(fs.readFileSync(path.join(root,'docs/model/weights.json'),'utf8')));
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'tests/onnx-reference.json'),'utf8'));
let maxError=0,correct=0;
for(const item of fixtures){const result=model.predict(item.pixels.map(v=>v/255),weights);assert.equal(result.conv1.length,8*28*28);assert.equal(result.pool1.length,8*14*14);assert.equal(result.pool2.length,16*4*4);for(let i=0;i<10;i++){const error=Math.abs(result.scores[i]-item.logits[i]);maxError=Math.max(maxError,error);assert.ok(error<0.0002,`ONNX parity image ${item.index} digit ${i}: ${error}`);}assert.ok(Math.abs(result.probs.reduce((a,b)=>a+b,0)-1)<1e-9);if(result.probs.indexOf(Math.max(...result.probs))===item.label)correct++;}
assert.ok(model.normalizeInk(new Uint8Array(280*280),280,280).empty);
function stroke(dx,dy){const alpha=new Uint8Array(280*280);for(let y=30+dy;y<210+dy;y++)for(let x=80+dx;x<102+dx;x++)alpha[y*280+x]=255;return model.normalizeInk(alpha,280,280);}
const a=stroke(0,0),b=stroke(35,22);assert.equal(a.empty,false);assert.deepEqual(a.pixels,b.pixels);assert.ok(a.pixels.every(v=>v>=0&&v<=1));assert.ok(a.pixels.some(v=>v>0&&v<1));
const digits=JSON.parse(fs.readFileSync(path.join(root,'docs/model/examples.json'),'utf8'));
const examples=digits.map(e=>{const p=model.predict(e.pixels.map(v=>v/255),weights).probs;return {label:e.digit,predicted:p.indexOf(Math.max(...p))};});assert.ok(examples.every(x=>x.label===x.predicted));
assert.throws(()=>model.predict([0,1],weights));assert.throws(()=>model.validate({weights:{}}));
const report={referenceImages:fixtures.length,referenceCorrect:correct,maxLogitError:maxError,allTenExamplesCorrect:true,blankAndTranslationChecks:true};console.log(report);
