(function(root){
const kernels={vertical:[[-1,0,1],[-1,0,1],[-1,0,1]],horizontal:[[-1,-1,-1],[0,0,0],[1,1,1]],sharpen:[[0,-1,0],[-1,5,-1],[0,-1,0]],blur:[[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]]};
function preset(name){return Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>name==='vertical'?(c>=4?1:0):name==='horizontal'?(r>=4?1:0):name==='cross'?((r===3||r===4||c===3||c===4)?1:0):name==='diagonal'?(Math.abs(r-c)<2?1:0):0));}
function convolution(a,k,s=1,p=0){let n=Math.floor((a.length+2*p-k.length)/s)+1;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>k.reduce((sum,row,i)=>sum+row.reduce((v,w,j)=>v+w*(a[r*s+i-p]?.[c*s+j-p]??0),0),0)));}
function relu(a){return a.map(row=>row.map(v=>Math.max(0,v)));}
function pool(a){const n=Math.floor(a.length/2);return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>Math.max(a[2*r][2*c],a[2*r+1][2*c],a[2*r][2*c+1],a[2*r+1][2*c+1])));}
function softmax(a){const mx=Math.max(...a),e=a.map(v=>Math.exp(v-mx)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s);}
root.CNN={kernels,preset,convolution,relu,pool,softmax};if(typeof module!=='undefined')module.exports=root.CNN;
})(typeof window!=='undefined'?window:globalThis);
