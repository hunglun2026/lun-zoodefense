/* 守護戰的闖關紀錄：每一關最好幾顆星。只存在這台裝置的 localStorage，不上傳、不蒐集個資。
   Progress.stars(key, n)、Progress.get()、Progress.defense()、Progress.clear() */
window.Progress = (function () {
  "use strict";
  const KEY = "zoodef-progress-v1";
  function get() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.stars) return s;
    } catch (e) { /* 無痕模式 */ }
    return { stars: {} };
  }
  function update(fn) {
    const s = get();
    fn(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* 存不了就算了，不影響遊戲 */ }
  }
  const stars = (key, n) => update((s) => { s.stars[key] = Math.max(s.stars[key] || 0, n); });
  const clear = () => { try { localStorage.removeItem(KEY); } catch (e) { /* 忽略 */ } };
  // 過了幾關、共幾顆星（鍵 defense-1～defense-10）
  const defense = () => {
    const s = get().stars;
    const lv = Object.keys(s).filter((k) => /^defense-\d+$/.test(k) && s[k] > 0);
    return { cleared: lv.length, stars: lv.reduce((n, k) => n + s[k], 0) };
  };
  return { get, stars, clear, defense };
})();
