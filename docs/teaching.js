/* Original beginner examples. The numbers in these stories are illustrative. */
const LessonNarrative = {
  steps: [
    {title:'像拼馬賽克，把筆畫變成一格格深淺。', example:'遠看是一個數字，近看是一片片小方格。電腦先記下每格多亮，才有辦法開始計算。', bridge:'每一格叫「像素」。在手寫模式裡，黑色記成 0，白色記成 1，灰色介於兩者之間；這些值還沒有「這是 7」的意思。', next:'下一站：這些小方格裡，有哪些值得注意的筆畫？'},
    {title:'拿一個小紙框，逐段看布上的花紋。', example:'每次只露出一小塊，用同一套規則檢查它；把紙框移到旁邊，再檢查一次。', bridge:'CNN 用「濾鏡」做局部計算：小格裡的數字逐一相乘、加總，再加上一個固定數值。各位置的結果排回方格，就是「特徵圖」。', next:'下一站：同一張特徵圖裡，有正數也有負數，接下來怎麼處理？'},
    {title:'想像一項「只發、不倒扣」的額外獎金。', example:'算出 3 元，就發 3 元；算出 −2 元，這筆獎金是 0 元。這個規則只把低於 0 的部分截掉。', bridge:'ReLU 對每一格做同樣的事：−2 變 0、0 還是 0、3 還是 3。負數本身沒有算錯；這一步只是照固定規則轉換。', next:'下一站：數值很多，能不能把附近幾格濃縮成一格？'},
    {title:'記錄一區的最高溫，先保留四站中最大的值。', example:'四個測站量到 21、24、22、23 度。若只報這一區的最高溫，就記下 24。', bridge:'「最大池化」也從小區域取最大值。它保留最強的回應，並縮小方格；其餘數字與最大值的精確位置，就沒有一起留下。', next:'下一站：把留下的線索合起來，替每個可能答案評分。'},
    {title:'像選餐廳：同一份資料，不同偏好會給不同分數。', example:'假設你替美味和方便各打分，再決定各占多少分量。重視美味，就把美味的分數乘上較大的正數。', bridge:'這裡的「分量」就是權重。CNN 把每個特徵值乘上權重，再加總成類別分數；權重也可以是負數。每個答案各有一套權重，由訓練資料學來。', next:'現在回頭改一筆：輸入變了，特徵值與預測會變；模型學好的權重仍相同。'}
  ],
  example(num) {
    const s=this.steps[num-1];
    return `<section class="lesson-story" aria-label="這一步的生活例子"><div><span class="story-label">先想一個生活例子</span><h3>${s.title}</h3><p>${s.example}</p></div><div class="story-bridge"><span class="story-label">回到影像的計算</span><p>${s.bridge}</p></div></section>`;
  },
  next(num) { return `<p class="lesson-thread">${this.steps[num-1].next}</p>`; }
};
