/* 動物園守護戰（獨立網站）的共用小工具與頁面外殼。
   介面沿用動物探險家的 Zoo.* 名稱（esc、el、shuffle、grade、dialog、photo、hashParams、boot），
   fx.js、speak.js、zhuyin.js 原樣沿用，所以這裡提供它們要用的那幾個。
   負責：小工具、年級、自製對話框、動物資料載入（data/animals.json）、頁首與頁尾、Zoo.boot。 */
(function () {
  "use strict";
  const V = "2"; // 資料與縮圖的快取版號，換資料時升版

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  // 自製確認對話框（不用瀏覽器內建的 alert／confirm）
  function dialog(message, buttons) {
    return new Promise((resolve) => {
      const d = document.createElement("dialog");
      d.className = "zdlg";
      d.innerHTML = "<p>" + esc(message) + '</p><div class="row"></div>';
      (buttons || [{ label: "好", value: true, primary: true }]).forEach((b) => {
        const btn = document.createElement("button");
        btn.className = "btn" + (b.primary ? " primary" : "") + (b.danger ? " danger" : "");
        btn.textContent = b.label;
        btn.onclick = () => { d.close(); d.remove(); resolve(b.value); };
        d.lastChild.appendChild(btn);
      });
      document.body.appendChild(d);
      d.showModal();
    });
  }

  // 年級（low／mid／high）：影響注音、朗讀語速與干擾選項難度。換年級發 zoo-grade 事件，頁面不用重整
  const GRADES = { low: "低年級", mid: "中年級", high: "高年級" };
  function grade() {
    try { const g = localStorage.getItem("zoo-grade"); if (GRADES[g]) return g; } catch (e) { /* 無痕模式 */ }
    return "mid";
  }
  function setGrade(g) {
    if (!GRADES[g]) return;
    try { localStorage.setItem("zoo-grade", g); } catch (e) { /* 忽略 */ }
    document.documentElement.dataset.grade = g;
    document.dispatchEvent(new CustomEvent("zoo-grade", { detail: g }));
  }
  document.documentElement.dataset.grade = grade();

  // 網址 #m=3&grade=low：老師班級連結。年級只收 low／mid／high，套用完把 grade 從網址拿掉
  function hashParams() {
    const h = location.hash.slice(1);
    const out = {};
    if (h.includes("=")) new URLSearchParams(h).forEach((v, k) => { out[k] = v; });
    return out;
  }
  (function applyClassLink() {
    const p = hashParams();
    if (GRADES[p.grade]) {
      setGrade(p.grade);
      const q = new URLSearchParams(location.hash.slice(1)); q.delete("grade");
      history.replaceState(null, "", location.pathname + (q.toString() ? "#" + q : ""));
    }
  })();

  // 動物資料：data/animals.json 瘦身清單，補上畫面用的欄位
  async function load() {
    const r = await fetch("/data/animals.json?v=" + V);
    if (!r.ok) throw new Error("動物資料載入失敗 " + r.status);
    const list = (await r.json()).animals;
    return list.map((a) => ({
      id: a.id, name: a.name_ch, nameClean: a.name_ch, name_ch: a.name_ch, group: a.group, name_suspect: false,
      groupInfo: { id: a.group, name: a.group_name, hint: a.hint, emoji: a.emoji },
      thumb: "/img/thumbs/" + a.id + ".webp?v=" + V,
    }));
  }

  // 題目用的照片：縮圖載入失敗就退回類別 emoji
  function photo(a, i, cls) {
    const img = new Image();
    img.className = "photo " + (cls || "");
    img.alt = a.nameClean;
    img.src = a.thumb;
    img.onerror = () => {
      const d = document.createElement("div");
      d.className = "ph " + (cls || "");
      d.innerHTML = '<span aria-hidden="true">' + a.groupInfo.emoji + "</span>";
      d.setAttribute("role", "img");
      d.setAttribute("aria-label", a.nameClean);
      img.replaceWith(d);
    };
    return img;
  }

  window.Zoo = { esc, el, shuffle, dialog, grade, setGrade, hashParams, GRADES, load, photo };

  // ---- 頁首與頁尾 ----
  const main = document.querySelector("main");
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  main.before(wrap);
  wrap.innerHTML =
    '<header class="top"><a class="logo" href="/">🛡️ 動物園守護戰</a><nav aria-label="相關連結"><a href="https://zoo.hunglun.com/">動物探險家</a><a href="https://www.hunglun.com/tools/games">更多遊戲</a></nav>' +
    '<button class="gradebtn" id="gradebtn"></button></header>';
  wrap.appendChild(main);
  const ICON = { low: "🌱", mid: "🌿", high: "🌳" };
  const gb = document.getElementById("gradebtn");
  const drawGrade = () => {
    const g = grade();
    gb.textContent = ICON[g] + " " + GRADES[g];
    gb.setAttribute("aria-label", "目前是" + GRADES[g] + "，按一下換年級");
  };
  gb.onclick = async () => {
    const g = await dialog("你幾年級？低年級會顯示注音、朗讀比較慢，題目的選項也比較好分。", Object.keys(GRADES).map((k) =>
      ({ label: ICON[k] + " " + GRADES[k], value: k, primary: k === grade() })).concat([{ label: "取消", value: "" }]));
    if (g) setGrade(g);
  };
  document.addEventListener("zoo-grade", drawGrade);
  drawGrade();
  const foot = document.createElement("footer");
  foot.className = "foot";
  foot.innerHTML =
    '<div class="foot-brand"><img src="/img/hunglun-logo.webp" alt="鴻綸科技" width="282" height="56"></div>' +
    '<p class="foot-copy">動物名字與照片來自臺北市立動物園開放資料，依政府資料開放授權條款使用，由鴻綸科技整理製作。遊戲程式與介面設計 © 2026 鴻綸科技。</p>';
  wrap.appendChild(foot);

  // Zoo.boot(fn)：載入動物資料後呼叫 fn(animals)，處理載入中與失敗畫面
  Zoo.boot = async function (fn) {
    main.insertAdjacentHTML("beforeend", '<div class="loading" id="boot">動物們正在集合…🐾</div>');
    try {
      const animals = await load();
      document.getElementById("boot").remove();
      await fn(animals);
      document.documentElement.dataset.ready = Math.round(performance.now());
    } catch (e) {
      console.error(e);
      const b = document.getElementById("boot");
      if (b) { b.className = "err"; b.innerHTML = '資料載入失敗了。請檢查網路後重新整理。<br><button class="btn" onclick="location.reload()">重新整理</button>'; }
    }
  };
})();
