const assert=require('node:assert/strict');
const model=require('../docs/digit-model.js');
const weights=model.validate(require('../docs/model/weights.json'));
const examples=require('../docs/model/examples.json');
const original=JSON.stringify(weights);let checks=0;
for(const example of examples){
 const trace=model.predict(example.pixels.map(v=>v/255),weights);
 for(let digit=0;digit<10;digit++){
  const index=Array.from(trace.pool2,(_,i)=>i).sort((a,b)=>Math.abs(trace.pool2[b]*weights.Parameter193[b*10+digit])-Math.abs(trace.pool2[a]*weights.Parameter193[a*10+digit]))[0];
  for(const multiplier of [0,-1,1,2]){
   const result=model.explainClassification(trace.pool2,weights,digit,index,multiplier);
   assert.deepEqual(result.scores,trace.scores);assert.deepEqual(result.probs,trace.probs);
   assert.ok(Math.abs(result.contribution+result.otherSum+result.bias-result.scores[digit])<0.00002);
   assert.ok(Math.abs(result.changedScores[digit]-result.scores[digit]-result.contribution*(multiplier-1))<0.00002);
   for(let other=0;other<10;other++)if(other!==digit)assert.equal(result.changedScores[other],trace.scores[other]);
   assert.ok(Math.abs(result.changedProbs.reduce((a,b)=>a+b,0)-1)<1e-12);
   if(multiplier===1){assert.deepEqual(result.changedScores,trace.scores);assert.deepEqual(result.changedProbs,trace.probs);}checks++;
  }
 }
}
const empty=new Float32Array(256);
const zero=model.explainClassification(empty,weights,3,18,2);assert.equal(zero.contribution,0);assert.deepEqual(zero.scores,zero.changedScores);
assert.equal(JSON.stringify(weights),original,'Teaching controls must not mutate learned model weights');
assert.throws(()=>model.explainClassification(empty,weights,10,0));assert.throws(()=>model.explainClassification(empty,weights,0,256));
console.log({checks,scoreDecomposition:true,zeroFeature:true,modelUnchanged:true});
