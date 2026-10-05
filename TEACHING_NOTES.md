# 零基礎敘事改寫依據（2026-10-05）

這次讀取的是影片製作者的官方文字教材，沒有宣稱完整觀看影片。生活比喻、中文敘事與互動均另行設計。

- 3Blue1Brown, But what is a Neural Network? https://www.3blue1brown.com/lessons/neural-networks/
  - 實際閱讀：手寫字問題動機、像素、輸出、為何分層、先談用途再進入權重符號，以及特徵直覺不保證就是實際學到的表示。
  - 採用敘事方法：具體任務 → 看輸入輸出 → 拆開中途運算 → 最後引入公式。不沿用原文句子；本站實際模型是 CNN，官方教材示範的簡單網路不同。
- deeplizard, CNNs explained https://deeplizard.com/learn/video/YRhxdVk_sIs
  - 實際閱讀：影像用途、濾鏡、手寫字範例、滑動小區域與一個輸出值的對應。
  - 採用敘事方法：同一張字的圖貫穿步驟；局部計算先於參數名詞。不把所有通道命名為確定的物件或形狀。
- Stanford CS231n https://cs231n.github.io/convolutional-networks/ 與 https://cs231n.github.io/linear-classify/
  - 核對局部連接與共享權重、ReLU、最大池化、分類係數與偏置。模型尺寸則以本地已驗證權重及推論程式為準。
- He et al., Deep Residual Learning for Image Recognition https://arxiv.org/html/1512.03385v1
  - 核對更深普通網路的訓練退化、identity shortcut、F(x)+x、原始 basic block 相加後 ReLU、尺寸對齊。
  - 音量刻度 40+5 為加法比喻，不是分貝、不模擬 ResNet。固定 4×4 特徵圖只展示相加前後，不證明訓練準確率。
- DeepLearning.AI, C4W2L04 Why ResNets Work, https://www.youtube.com/watch?v=RYth6EbBUqM
  - 官方搜尋結果確認標題、發布者、2017-11-07。加入進階學習連結；技術結論根據原論文，不引用第三方自動摘要。

教學邊界：保持原有程式與實際預測。手寫 CNN 並非 ResNet；權重在辨識時保持固定；分類百分比不等於測得正確率；負數不是錯誤資訊；池化丟失資訊；修正量不是答案誤差；原始區塊若含 post-add ReLU，不能對任意負 x 宣稱整個區塊恆等。
