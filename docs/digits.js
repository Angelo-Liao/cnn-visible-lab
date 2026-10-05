(function(){
  'use strict';
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const raw=document.createElement('canvas');raw.width=raw.height=280;
  const ink=raw.getContext('2d',{willReadFrequently:true});
  const d={pixels:new Float32Array(784),empty:true,trace:null,weights:null,status:'loading',examples:[],channel:0,pos:406,poolPos:98,step:0,history:[],timer:null,keyboard:{x:140,y:64,pen:false,visible:false},loading:null,revision:0,origin:'drawing'};
  let goStep=()=>{},pointer=null,lastPoint=null,frame=null;
  const f=v=>Math.abs(v)<.00005?'0':v.toFixed(3);
  const channel=(a,n,c=d.channel)=>a.slice(c*n*n,(c+1)*n*n);
  function stop(){clearInterval(d.timer);d.timer=null;if(q('#digit-play'))q('#digit-play').textContent='自動掃描';d.keyboard.pen=false;}
  function active(){return !!q('#digit-view');}
  async function load(){
    if(d.loading)return d.loading;
    d.status='loading';
    d.loading=(async()=>{
      try{const response=await fetch('model/weights.json');if(!response.ok)throw new Error('model unavailable');d.weights=DigitModel.validate(await response.json());d.status='ready';compute();}
      catch{d.status='error';d.weights=null;d.trace=null;}
      if(active())render(d.step,goStep);
    })();
    fetch('model/examples.json').then(r=>r.ok?r.json():Promise.reject()).then(items=>{
      d.examples=items.filter(x=>Number.isInteger(x.digit)&&x.digit>=0&&x.digit<=9&&x.pixels?.length===784);
      if(q('#digit-examples')){q('#digit-examples').innerHTML=exampleButtons();bindExamples();}
    }).catch(()=>{if(q('#digit-examples'))q('#digit-examples').textContent='範例暫時無法載入，仍可直接手寫。';});
    return d.loading;
  }
  function compute(){d.trace=!d.empty&&d.weights?DigitModel.predict(d.pixels,d.weights):null;}
  function sync(){
    const rgba=ink.getImageData(0,0,280,280).data,alpha=new Uint8Array(280*280);
    for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
    const prepared=DigitModel.normalizeInk(alpha,280,280);d.pixels=prepared.pixels;d.empty=prepared.empty;d.origin='drawing';d.revision++;compute();updateInput();
  }
  function padPaint(){const canvas=q('#digit-pad');if(!canvas)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,280,280);ctx.drawImage(raw,0,0);if(d.keyboard.visible){ctx.strokeStyle='#a84f35';ctx.lineWidth=1.5;ctx.strokeRect(d.keyboard.x-8,d.keyboard.y-8,16,16);}}
  function remember(){d.history.push({image:ink.getImageData(0,0,280,280),pixels:d.pixels.slice(),empty:d.empty,origin:d.origin});if(d.history.length>24)d.history.shift();}
  function line(a,b){ink.strokeStyle='#25231f';ink.fillStyle='#25231f';ink.lineWidth=22;ink.lineCap='round';ink.lineJoin='round';if(a.x===b.x&&a.y===b.y){ink.beginPath();ink.arc(a.x,a.y,11,0,Math.PI*2);ink.fill();}else{ink.beginPath();ink.moveTo(a.x,a.y);ink.lineTo(b.x,b.y);ink.stroke();}padPaint();}
  function schedule(){if(frame!==null)return;frame=requestAnimationFrame(()=>{frame=null;sync();});}
  function placeExample(example){remember();ink.clearRect(0,0,280,280);const tiny=document.createElement('canvas');tiny.width=tiny.height=28;const ctx=tiny.getContext('2d'),image=ctx.createImageData(28,28);example.pixels.forEach((v,i)=>{image.data[i*4]=37;image.data[i*4+1]=35;image.data[i*4+2]=31;image.data[i*4+3]=v;});ctx.putImageData(image,0,0);ink.imageSmoothingEnabled=true;ink.drawImage(tiny,0,0,280,280);d.pixels=Float32Array.from(example.pixels,v=>v/255);d.empty=false;d.origin='example';d.revision++;compute();padPaint();updateInput();}
  function exampleButtons(){return d.examples.length?d.examples.map(e=>`<button class="digit-example" data-digit-example="${e.digit}" aria-label="載入數字 ${e.digit} 的 MNIST 範例">${e.digit}</button>`).join(''):'<span class="micro">正在載入範例…</span>';}
  function bindExamples(){qa('[data-digit-example]').forEach(b=>b.onclick=()=>placeExample(d.examples.find(e=>e.digit===+b.dataset.digitExample)));}
  function statusText(){return d.status==='error'?'模型載入失敗，請重試。你的筆畫仍保留在畫布上。':d.status==='loading'?'正在載入數字模型…':d.empty?'請在方格中寫一個 0–9 的數字。':'像素已更新，可以逐步查看或直接看預測。';}
  function gridCanvas(id,label){return `<canvas id="${id}" class="digit-grid" width="336" height="336" role="img" aria-label="${label}"></canvas>`;}
  function updateInput(){
    if(!q('#digit-pad'))return;
    drawGrid(q('#digit-pixels'),d.pixels,28,{gray:true});
    q('#digit-pad-hint').hidden=!d.empty;
    q('#digit-status').textContent=statusText();
    q('#digit-predict').disabled=!d.trace;q('#digit-undo').disabled=!d.history.length;
    q('#digit-input-note').textContent=d.origin==='example'?'已載入 MNIST 測試集原始像素；範例標籤不會傳給模型。':'筆畫自動裁切、保留比例縮放，再移到中央。灰階值介於 0 和 1。';
  }
  function renderInput(){
    return lessonShell(1,'寫一個數字，交給 CNN 看。','<p>寫一個 0–9 的數字。你看到的是筆畫，程式收到的是 <b>28 × 28 個亮度數字</b>，共 784 格。</p><p>「模型」就是已經學好一組計算規則的程式。這裡的模型曾看過許多有答案的手寫範例，現在用學好的規則辨識你的字。</p>','先寫一個 7，或按範例「7」。接著看像素格：它保留了筆畫位置，還沒有說出答案。',`<div class="row-between"><h3>從你的筆畫開始</h3><span class="badge">手寫數字 · 真實 CNN</span></div><div class="digit-input-pair"><div><div class="viz-label">手寫畫布<small>滑鼠 / 觸控</small></div><div class="digit-pad-wrap"><canvas id="digit-pad" width="280" height="280" tabindex="0" role="img" aria-label="手寫數字畫布。可直接畫圖；鍵盤操作請參考下方說明。"></canvas><span id="digit-pad-hint">在這裡<br><em>寫一個數字</em></span></div><div class="digit-pad-tools"><button id="digit-clear" class="btn">清空重畫</button><button id="digit-undo" class="btn">復原一筆</button></div></div><div><div class="viz-label">轉成像素格<small>28 × 28 × 1</small></div>${gridCanvas('digit-pixels','模型實際輸入的 28 乘 28 灰階像素格，白色為筆畫、黑色為背景')}<p class="caption" id="digit-input-note"></p></div></div><div class="digit-example-row"><span class="micro">或載入範例</span><div id="digit-examples">${exampleButtons()}</div></div><div class="digit-input-bottom"><p id="digit-status" class="micro" role="status"></p><button id="digit-predict" class="btn primary">看數字預測</button></div><details class="digit-keyboard"><summary>鍵盤操作方式</summary><p>以 Tab 選取畫布，按方向鍵移動游標；按空白鍵開啟畫筆，移動時就會留下筆畫。再按一次空白鍵或 Esc 停筆。也能直接用上方的 0–9 範例按鈕探索。</p></details>${d.status==='error'?'<button id="digit-retry" class="btn">重新載入模型</button>':''}`,'淺色畫布上的深色筆畫，在模型輸入中會轉成「白色筆畫、黑色背景」。這是配合 MNIST 模型的數值格式；辨識與筆畫處理都在你的瀏覽器內執行。');
  }
  function bindPad(){
    const canvas=q('#digit-pad');padPaint();updateInput();bindExamples();
    function point(e){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(280,(e.clientX-r.left)*280/r.width)),y:Math.max(0,Math.min(280,(e.clientY-r.top)*280/r.height))};}
    canvas.onpointerdown=e=>{if(pointer!==null||e.button>0)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);d.keyboard.visible=false;remember();lastPoint=point(e);line(lastPoint,lastPoint);schedule();};
    canvas.onpointermove=e=>{if(e.pointerId!==pointer)return;e.preventDefault();const next=point(e);line(lastPoint,next);lastPoint=next;schedule();};
    function end(e){if(e.pointerId!==pointer)return;pointer=null;lastPoint=null;if(frame!==null){cancelAnimationFrame(frame);frame=null;}sync();}
    canvas.onpointerup=end;canvas.onpointercancel=end;canvas.onlostpointercapture=end;
    canvas.onkeydown=e=>{const delta={ArrowUp:[0,-7],ArrowDown:[0,7],ArrowLeft:[-7,0],ArrowRight:[7,0]}[e.key];if(e.key===' '){e.preventDefault();d.keyboard.visible=true;d.keyboard.pen=!d.keyboard.pen;if(d.keyboard.pen){remember();line(d.keyboard,d.keyboard);sync();}padPaint();}else if(e.key==='Escape'){d.keyboard.pen=false;padPaint();}else if(delta){e.preventDefault();const from={...d.keyboard};d.keyboard.visible=true;d.keyboard.x=Math.max(10,Math.min(270,d.keyboard.x+delta[0]));d.keyboard.y=Math.max(10,Math.min(270,d.keyboard.y+delta[1]));if(d.keyboard.pen){line(from,d.keyboard);sync();}padPaint();}};
    canvas.onblur=()=>{d.keyboard.visible=false;d.keyboard.pen=false;padPaint();};
    q('#digit-clear').onclick=()=>{remember();ink.clearRect(0,0,280,280);d.keyboard.pen=false;padPaint();sync();};
    q('#digit-undo').onclick=()=>{const previous=d.history.pop();if(!previous)return;ink.putImageData(previous.image,0,0);Object.assign(d,{pixels:previous.pixels,empty:previous.empty,origin:previous.origin});d.revision++;compute();padPaint();updateInput();};
    q('#digit-predict').onclick=()=>goStep(4);
    if(q('#digit-retry'))q('#digit-retry').onclick=()=>{d.loading=null;load();render(d.step,goStep);};
  }
  function drawGrid(canvas,values,n,{gray=false,selected=-1,highlight=[],scale}={}){
    if(!canvas)return;const ctx=canvas.getContext('2d'),size=canvas.width,cell=size/n;
    scale=scale||Math.max(.001,...Array.from(values,Math.abs));
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const v=values[y*n+x],t=Math.min(1,Math.abs(v)/scale);ctx.fillStyle=gray?`rgb(${Math.round(v*255)} ${Math.round(v*255)} ${Math.round(v*255)})`:color(v,scale);
      ctx.fillRect(x*cell,y*cell,Math.ceil(cell),Math.ceil(cell));
    }
    ctx.strokeStyle=gray?'rgba(255,255,255,.14)':'rgba(80,71,55,.16)';ctx.lineWidth=.6;
    ctx.beginPath();for(let i=0;i<=n;i++){ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,size);ctx.moveTo(0,i*cell);ctx.lineTo(size,i*cell);}ctx.stroke();
    if(highlight.length){ctx.strokeStyle='#d88552';ctx.lineWidth=2;for(const i of highlight)ctx.strokeRect((i%n)*cell+1,Math.floor(i/n)*cell+1,cell-2,cell-2);}
    if(selected>=0){ctx.strokeStyle=gray?'#e5a370':'#a84f35';ctx.lineWidth=3;ctx.strokeRect((selected%n)*cell+1.5,Math.floor(selected/n)*cell+1.5,cell-3,cell-3);}
  }
  function filterChoices(){return `<div class="digit-channels" aria-label="選擇第一層濾鏡">${Array.from({length:8},(_,i)=>`<button class="digit-channel ${i===d.channel?'active':''}" data-channel="${i}" aria-pressed="${i===d.channel}"><canvas width="64" height="64" data-feature="${i}" aria-hidden="true"></canvas><span>濾鏡 ${i+1}</span></button>`).join('')}</div>`;}
  function bindChannels(){qa('[data-feature]').forEach(c=>drawGrid(c,channel(d.trace.relu1,28,+c.dataset.feature),28));qa('[data-channel]').forEach(b=>b.onclick=()=>{stop();d.channel=+b.dataset.channel;render(d.step,goStep);q(`[data-channel="${d.channel}"]`)?.focus({preventScroll:true});});}
  function patchMarkup(){const y=Math.floor(d.pos/28),x=d.pos%28,w=d.weights.Parameter5.slice(d.channel*25,(d.channel+1)*25),values=[];for(let ky=0;ky<5;ky++)for(let kx=0;kx<5;kx++){const yy=y+ky-2,xx=x+kx-2;values.push(yy>=0&&yy<28&&xx>=0&&xx<28?d.pixels[yy*28+xx]:0);}return `<div class="digit-patch"><div><span class="micro">這一小塊輸入</span><div class="digit-mini-grid">${values.map(v=>`<span>${f(v)}</span>`).join('')}</div></div><span class="digit-times">×</span><div><span class="micro">學到的濾鏡 ${d.channel+1}</span><div class="digit-mini-grid weights">${w.map(v=>`<span>${f(v)}</span>`).join('')}</div></div></div><p class="micro">25 組對應值相乘加總，再加偏置 <b>${f(d.weights.Parameter6[d.channel])}</b></p><div class="digit-equation">第 ${y+1} 列，第 ${x+1} 欄 <span>＝</span> <output>${f(d.trace.conv1[d.channel*784+d.pos])}</output></div>`;}
  function bindGrid(canvas,n,getPos,setPos){
    canvas.tabIndex=0;canvas.setAttribute('role','slider');canvas.setAttribute('aria-valuemin','1');canvas.setAttribute('aria-valuemax',String(n*n));
    function change(i){setPos(Math.max(0,Math.min(n*n-1,i)));canvas.setAttribute('aria-valuenow',String(getPos()+1));canvas.setAttribute('aria-valuetext',`第 ${Math.floor(getPos()/n)+1} 列，第 ${getPos()%n+1} 欄`);}
    canvas.onclick=e=>{const r=canvas.getBoundingClientRect();change(Math.floor((e.clientY-r.top)*n/r.height)*n+Math.floor((e.clientX-r.left)*n/r.width));};
    canvas.onkeydown=e=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-n,ArrowDown:n}[e.key];if(delta!==undefined){e.preventDefault();change(getPos()+delta);}};change(getPos());
  }
  function refreshConv(){const y=Math.floor(d.pos/28),x=d.pos%28,hi=[];for(let ky=-2;ky<=2;ky++)for(let kx=-2;kx<=2;kx++)if(y+ky>=0&&y+ky<28&&x+kx>=0&&x+kx<28)hi.push((y+ky)*28+x+kx);drawGrid(q('#digit-conv-input'),d.pixels,28,{gray:true,highlight:hi});drawGrid(q('#digit-conv-output'),channel(d.trace.conv1,28),28,{selected:d.pos});q('#digit-patch').innerHTML=patchMarkup();q('#digit-position').value=d.pos;q('#digit-position-count').textContent=`${d.pos+1} / 784`;q('#digit-conv-output').setAttribute('aria-valuenow',String(d.pos+1));}
  function renderConv(){return lessonShell(2,'同一個濾鏡，掃過你的數字。','<p>上一站只有亮度。這一站要問：<b>影像的哪些小區域，會讓某套計算規則有較強反應？</b></p><p>這套小規則叫「濾鏡」。本模型有 8 個，各自用 5 × 5 個權重計算一張回應圖；每張圖也稱一個「通道」。</p><details class="lesson-extra"><summary>權重、偏置各是什麼？</summary><p>權重是拿來相乘的數字。25 格逐一乘上對應權重、加總，再加上一個固定數值「偏置」。它們都是訓練時學來的。</p></details>','先比較濾鏡 1 和 2：同一個字，回應圖為什麼不同？再按自動掃描，看小框移到哪裡。',`<div class="row-between"><h3>8 個濾鏡，各自找到不同的回應</h3><span class="badge">第一層捲積</span></div>${filterChoices()}<div class="digit-map-pair"><div><div class="viz-label">你的數字<small>橘框為 5 × 5 區域</small></div>${gridCanvas('digit-conv-input','你的數字與正在掃描的 5 乘 5 區域')}</div><div><div class="viz-label">濾鏡 ${d.channel+1} 的輸出<small>點格子或用方向鍵</small></div>${gridCanvas('digit-conv-output','選擇捲積輸出位置')}</div></div><div class="playbar"><button class="btn" id="digit-play">自動掃描</button><input id="digit-position" type="range" min="0" max="783" value="${d.pos}" aria-label="數字濾鏡掃描位置"><span id="digit-position-count" class="micro"></span></div><details class="lesson-extra"><summary>這一格的數字怎麼算？</summary><div id="digit-patch" class="digit-calculation"></div></details><p class="caption">步幅 1；四周補 2 格 0，保留 28 × 28 尺寸。上方縮圖顯示 ReLU 後的回應，方便比較濾鏡；大圖顯示 ReLU 前的值。各圖色階依其最大絕對值調整。</p>`,'這些濾鏡權重來自預先訓練的 MNIST 模型。數學運算不翻轉濾鏡，精確名稱為互相關；深度學習中通常稱為捲積。顯示小數取至三位，計算保留完整精度。');}
  function bindConv(){bindChannels();bindGrid(q('#digit-conv-output'),28,()=>d.pos,i=>{d.pos=i;refreshConv();});q('#digit-position').oninput=e=>{d.pos=+e.target.value;refreshConv();};q('#digit-play').onclick=()=>{if(d.timer)return stop();d.timer=setInterval(()=>{d.pos=(d.pos+1)%784;refreshConv();},180);q('#digit-play').textContent='暫停';};refreshConv();}
  function renderRelu(){const before=channel(d.trace.conv1,28),after=channel(d.trace.relu1,28);return lessonShell(3,'負值歸零，正值留下。','<p>剛才的回應有正也有負。現在每格都照同一個規則：<b>負值改成 0，其他不變</b>。這一步叫 ReLU。</p><p>它讓模型對正數、負數有不同反應，能組合出更複雜的判斷；方格大小保持 28 × 28。</p><details class="lesson-extra"><summary>為什麼不只做加權相加？</summary><p>如果每層都只做加權相加，再多層也能合併成一次同類型的運算。ReLU 在 0 的地方改變規則，打破這個限制，稱為「非線性」。公式 max(0, x) 就是取 0 和 x 較大的那個。</p></details>','找到左圖的赭色格子，再看右圖同一個位置。它們都變成 0；原來的正值還在。',`<h3>濾鏡 ${d.channel+1} · 同一張特徵圖的前後</h3>${filterChoices()}<div class="digit-map-pair"><div><div class="viz-label">ReLU 前<small>包含正值與負值</small></div>${gridCanvas('digit-relu-before','ReLU 前的特徵圖')}</div><div><div class="viz-label">ReLU 後<small>所有負值改成 0</small></div>${gridCanvas('digit-relu-after','ReLU 後的特徵圖')}</div></div><p class="digit-observation">這張特徵圖有 <b>${Array.from(before).filter(v=>v<0).length}</b> 個負值被改成 0。</p><p class="caption">兩張圖共用色階；淺色代表接近 0。例：${f(Math.min(...before))} → ${f(Math.max(0,Math.min(...before)))}。</p>`,'ReLU 不會縮小特徵圖，也不能把負值直接解讀成錯誤資訊。這一步顯示的是你畫的數字在模型內的實際結果。');}
  function bindRelu(){bindChannels();const before=channel(d.trace.conv1,28),scale=Math.max(.001,...Array.from(before,Math.abs));drawGrid(q('#digit-relu-before'),before,28,{scale});drawGrid(q('#digit-relu-after'),channel(d.trace.relu1,28),28,{scale});}
  function refreshPool(){const y=Math.floor(d.poolPos/14),x=d.poolPos%14,indices=[y*2*28+x*2,y*2*28+x*2+1,(y*2+1)*28+x*2,(y*2+1)*28+x*2+1],a=channel(d.trace.relu1,28),b=channel(d.trace.pool1,14),scale=Math.max(.001,...a);drawGrid(q('#digit-pool-before'),a,28,{highlight:indices,scale});drawGrid(q('#digit-pool-after'),b,14,{selected:d.poolPos,scale});q('#digit-pool-calculation').innerHTML=`max(${indices.map(i=>f(a[i])).join(', ')}) <span>＝</span> <output>${f(b[d.poolPos])}</output>`;}
  function renderPool(){return lessonShell(4,'每四格，留下一個最大值。','<p>現在每一小區只留一個代表：把相鄰 <b>2 × 2 的四格</b>放一組，留下最大值，叫「最大池化」。</p><p>8 張回應圖各自從 28 × 28 縮成 14 × 14。後續需要處理的數字變少，但部分位置和細節也會失去。</p>','點右邊的格子，看它是由左邊哪四個值形成。',`<h3>濾鏡 ${d.channel+1} · 最大池化</h3>${filterChoices()}<div class="digit-map-pair"><div><div class="viz-label">ReLU 結果<small>28 × 28</small></div>${gridCanvas('digit-pool-before','池化前的 28 乘 28 特徵圖')}</div><div><div class="viz-label">池化結果<small>14 × 14 · 點格子查看</small></div>${gridCanvas('digit-pool-after','選擇池化輸出格子')}</div></div><div class="digit-equation" id="digit-pool-calculation"></div><p class="caption">窗口 2 × 2 · 步幅 2 · 不補零。這個模型接下來還會做一次捲積、ReLU 與池化，才進入分類。</p>`,'這裡顯示第一層的其中一張特徵圖。模型會將全部 8 張送入第二次捲積，沿輸入通道累加，產生 16 張新的特徵圖。');}
  function renderPrediction(){const ranked=d.trace.probs.map((p,digit)=>({p,digit})).sort((a,b)=>b.p-a.p),top=ranked[0];return lessonShell(5,'從 0 到 9，哪個最像？','<p>前面整理出的線索，現在用來替 <b>0–9 各評一個分數</b>。每個特徵值乘上對應權重、加總，再加上固定數值「偏置」，就得到一個答案的原始分數。</p><p>最後用 Softmax 比較這十個分數，轉成合計 100% 的比例。比例最高的是模型的預測，仍可能猜錯。</p>','往下點選一個特徵位置，看它的值乘上哪個權重，又如何影響某個數字的分數。',`<div class="digit-result-head"><div><span class="micro">模型最像的數字</span><div id="digit-result" class="digit-result" aria-live="polite">${top.digit}</div><span class="badge">模型分數 ${(top.p*100).toFixed(1)}%</span></div>${gridCanvas('digit-result-image','這次預測所使用的 28 乘 28 手寫數字')}<button class="btn" id="digit-back-draw">回去修改筆畫</button></div><p class="digit-result-note">${top.p<.65?'目前多個數字的分數接近。試著寫大、寫清楚，再比較結果。':'這是模型在十個數字之間的相對分數，不是辨識正確率；模型也可能很有把握地猜錯。'}</p><div class="digit-probabilities" aria-label="0 到 9 的模型分數">${d.trace.probs.map((p,i)=>`<div class="digit-probability ${i===top.digit?'winner':''}" data-prediction="${i}" data-probability="${p}"><b>${i}</b><span class="digit-track"><span style="width:${p*100}%"></span></span><output>${(p*100).toFixed(1)}%</output></div>`).join('')}</div><section id="classification-weights" aria-label="分類權重教學"></section><details class="digit-architecture"><summary>從剛才的池化，到這個預測</summary><div class="digit-flow"><span>14 × 14 × 8</span><i>→</i><span>5 × 5 捲積 + ReLU<br><small>14 × 14 × 16</small></span><i>→</i><span>3 × 3 最大池化<br><small>4 × 4 × 16</small></span><i>→</i><span>256 個特徵<br><small>10 個類別分數</small></span></div><p class="caption">第二次捲積步幅 1、補零 2。第二次池化步幅 3、無補零，14 ÷ 3 向下取整為 4，末端不足完整窗口的部分不納入。</p></details><p class="caption">模型：<a href="https://github.com/onnx/models/tree/main/validated/vision/classification/mnist" target="_blank" rel="noopener noreferrer">ONNX Model Zoo · MNIST CNN</a>。沒有把範例標籤傳入模型，也沒有用字型或形狀比對代替 CNN。</p>`,'這個模型受過辨識單一手寫數字的訓練。英文字母、多位數、空白或塗鴉不在這個分類任務內；即使輸入不合理，十類分類器仍可能給某個數字很高的分數。');}
  function emptyStep(){return `<div class="panel digit-empty"><p class="eyebrow">${d.status==='loading'?'正在準備模型':d.status==='error'?'模型暫時無法使用':'先給 CNN 一張影像'}</p><h2>${d.status==='error'?'你的筆畫還在，可以重新載入。':d.empty?'先寫一個數字，再看它怎麼計算。':'模型載入後，就能查看真正的計算。'}</h2><button class="btn primary" id="digit-start">回到影像輸入</button>${d.status==='error'?'<button class="btn" id="digit-retry">重試模型載入</button>':''}</div>`;}
  function render(step,onStep){
    goStep=onStep;d.step=step;const host=q('#lab-content');if(!host)return;
    const markup=`<div id="digit-view">${step===0?renderInput():!d.trace?emptyStep():[null,renderConv,renderRelu,renderPool,renderPrediction][step]()}</div>`;
    if(q('#digit-view'))q('#digit-view').outerHTML=markup;else host.innerHTML=markup;
    if(step===0)bindPad();else if(d.trace){if(step===1)bindConv();if(step===2)bindRelu();if(step===3){bindChannels();bindGrid(q('#digit-pool-after'),14,()=>d.poolPos,i=>{d.poolPos=i;refreshPool();});}if(step===4){drawGrid(q('#digit-result-image'),d.pixels,28,{gray:true});q('#digit-back-draw').onclick=()=>goStep(0);WeightLesson.mount(q('#classification-weights'),d.trace,d.weights);}}
    if(q('#digit-start'))q('#digit-start').onclick=()=>goStep(0);
    if(q('#digit-retry'))q('#digit-retry').onclick=()=>{d.loading=null;load();};
    if(!d.loading)load();
  }
  window.DigitLab={render,stop};
})();
