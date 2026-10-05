(function(root){
  'use strict';
  // Inference for the MIT-licensed ONNX Model Zoo MNIST CNN. See model/NOTICE.md.
  function validate(model){
    const sizes={Parameter5:200,Parameter6:8,Parameter87:3200,Parameter88:16,Parameter193:2560,Parameter194:10};
    for(const [key,size] of Object.entries(sizes))if(!Array.isArray(model.weights?.[key])||model.weights[key].length!==size||!model.weights[key].every(Number.isFinite))throw new Error('模型檔案不完整');
    return model.weights;
  }
  function conv(input,n,channels,weights,bias,outputs){
    const result=new Float32Array(n*n*outputs);
    for(let o=0;o<outputs;o++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      let sum=0;
      for(let c=0;c<channels;c++)for(let ky=0;ky<5;ky++){
        const iy=y+ky-2;if(iy<0||iy>=n)continue;
        for(let kx=0;kx<5;kx++){const ix=x+kx-2;if(ix>=0&&ix<n)sum+=input[(c*n+iy)*n+ix]*weights[((o*channels+c)*5+ky)*5+kx];}
      }
      result[(o*n+y)*n+x]=Math.fround(sum)+bias[o];
    }
    return result;
  }
  function relu(a){return a.map(v=>Math.max(0,v));}
  function pool(a,n,channels,k){
    const size=Math.floor(n/k),out=new Float32Array(size*size*channels);
    for(let c=0;c<channels;c++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      let value=-Infinity;
      for(let ky=0;ky<k;ky++)for(let kx=0;kx<k;kx++)value=Math.max(value,a[(c*n+y*k+ky)*n+x*k+kx]);
      out[(c*size+y)*size+x]=value;
    }
    return out;
  }
  function softmax(a){const max=Math.max(...a),e=Array.from(a,v=>Math.exp(v-max)),total=e.reduce((s,v)=>s+v,0);return e.map(v=>v/total);}
  function denseScores(features,weights,override){
    const scores=new Float32Array(10);
    for(let digit=0;digit<10;digit++){
      let sum=0;
      for(let i=0;i<256;i++){let weight=weights.Parameter193[i*10+digit];if(override&&override.digit===digit&&override.index===i)weight*=override.multiplier;sum+=features[i]*weight;}
      scores[digit]=Math.fround(sum)+weights.Parameter194[digit];
    }
    return scores;
  }
  function explainClassification(features,weights,digit,index,multiplier=1){
    if(features.length!==256||!Number.isInteger(digit)||digit<0||digit>9||!Number.isInteger(index)||index<0||index>=256||!Number.isFinite(multiplier))throw new Error('無效的分類權重設定');
    const terms=Array.from(features,(value,i)=>value*weights.Parameter193[i*10+digit]);
    const scores=denseScores(features,weights),changedScores=denseScores(features,weights,{digit,index,multiplier});
    return {feature:features[index],weight:weights.Parameter193[index*10+digit],contribution:terms[index],otherSum:terms.reduce((sum,value,i)=>sum+(i===index?0:value),0),bias:weights.Parameter194[digit],scores,probs:softmax(scores),changedScores,changedProbs:softmax(changedScores)};
  }
  function predict(pixels,weights){
    if(pixels.length!==784||!Array.from(pixels).every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new Error('輸入需為 28 × 28、介於 0 和 1 的像素');
    const input=Float32Array.from(pixels);
    const conv1=conv(input,28,1,weights.Parameter5,weights.Parameter6,8),relu1=relu(conv1),pool1=pool(relu1,28,8,2);
    const conv2=conv(pool1,14,8,weights.Parameter87,weights.Parameter88,16),relu2=relu(conv2),pool2=pool(relu2,14,16,3);
    const scores=denseScores(pool2,weights);
    return {conv1,relu1,pool1,conv2,relu2,pool2,scores,probs:softmax(scores)};
  }
  function normalizeInk(alpha,width,height){
    let minX=width,minY=height,maxX=-1,maxY=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(alpha[y*width+x]>20){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    const pixels=new Float32Array(784);
    if(maxX<0)return {pixels,empty:true};
    const scale=20/Math.max(maxX-minX+1,maxY-minY+1),ox=(28-(maxX-minX+1)*scale)/2,oy=(28-(maxY-minY+1)*scale)/2;
    // Area averaging retains antialiasing rather than forcing each pixel to 0 or 1.
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const value=alpha[y*width+x]/255;if(!value)continue;
      const x0=(x-minX)*scale+ox,x1=x0+scale,y0=(y-minY)*scale+oy,y1=y0+scale;
      for(let yy=Math.floor(y0);yy<Math.ceil(y1);yy++)for(let xx=Math.floor(x0);xx<Math.ceil(x1);xx++){
        if(xx>=0&&xx<28&&yy>=0&&yy<28)pixels[yy*28+xx]+=value*(Math.min(xx+1,x1)-Math.max(xx,x0))*(Math.min(yy+1,y1)-Math.max(yy,y0));
      }
    }
    let mass=0,cx=0,cy=0;for(let i=0;i<784;i++){pixels[i]=Math.min(1,pixels[i]);mass+=pixels[i];cx+=pixels[i]*(i%28);cy+=pixels[i]*Math.floor(i/28);}
    if(!mass)return {pixels:new Float32Array(784),empty:true};
    const dx=Math.round(13.5-cx/mass),dy=Math.round(13.5-cy/mass),centered=new Float32Array(784);
    for(let y=0;y<28;y++)for(let x=0;x<28;x++)if(x+dx>=0&&x+dx<28&&y+dy>=0&&y+dy<28)centered[(y+dy)*28+x+dx]=pixels[y*28+x];
    return {pixels:centered,empty:false};
  }
  root.DigitModel={validate,predict,normalizeInk,softmax,explainClassification};
  if(typeof module!=='undefined')module.exports=root.DigitModel;
})(typeof window!=='undefined'?window:globalThis);
