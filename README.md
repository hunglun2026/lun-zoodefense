# 動物園守護戰

https://zoodefense.hunglun.com

動物當砲塔，守住動物園的家。放動物不用答題，點動物回答「這是什麼動物？」答對就升級。一共 10 關，國小自然課的塔防小遊戲。

- 網站是純靜態檔（`public/`），由 Cloudflare 部署；沒有後端、沒有登入，闖關星數只存在這台裝置的 localStorage。
- 動物名字與照片來自臺北市立動物園開放資料，依政府資料開放授權條款使用。
- PixiJS 8.22.0（MIT）放在 `public/js/vendor/pixi.min.js`，原檔未修改。
- 測試：`npm test`（關卡資料檢查加機器人難度模擬）。
- 重新抓動物資料：`npm run build:animals`。
