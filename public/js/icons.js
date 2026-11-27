/* 動物園守護戰：自畫圖示（SVG，24×24，同一套粗細與圓角）。取代 emoji。
   用法：Zoo.icon("heart")、Zoo.icon("star", "off")。顏色由 css 的 .ic-* 決定。 */
(function (G) {
  "use strict";
  const S = 'stroke-linecap="round" stroke-linejoin="round"';
  const P = {
    heart: '<path d="M12 20.6S4.4 16 2.6 11.2C1.3 7.7 3.6 4.4 7 4.4c2 0 3.5 1 5 2.8 1.5-1.8 3-2.8 5-2.8 3.4 0 5.7 3.300 4.400 6.800C19.600 16 12 20.600 12 20.600z" class="f"/>',
    coin: '<circle cx="12" cy="12" r="9.500" class="f" stroke="#a8721a" stroke-width="1.600"/><circle cx="12" cy="12" r="5.800" fill="none" stroke="#c98d1e" stroke-width="2"/>',
    wave: '<path d="M6 21V3.500" fill="none" class="s" ' + S + '/><path d="M6.500 4.500h12l-3 4 3 4h-12z" class="f"/>',
    ff: '<path d="M3.500 5.500l8 6.500-8 6.500zM12.500 5.500l8 6.500-8 6.500z" class="f"/>',
    play: '<path d="M7 4.500l12.500 7.500L7 19.500z" class="f"/>',
    pause: '<rect x="6" y="4.500" width="4" height="15" rx="1.200" class="f"/><rect x="14" y="4.500" width="4" height="15" rx="1.200" class="f"/>',
    exit: '<path d="M10 4.500H5.500v15H10M14 8l4 4-4 4M18 12H9.500" fill="none" class="s" ' + S + '/>',
    lock: '<rect x="5.500" y="10.500" width="13" height="9.500" rx="2.200" class="f"/><path d="M8.500 10.500V8a3.500 3.500 0 017 0v2.500" fill="none" class="s" ' + S + '/>',
    star: '<path d="M12 2.800l2.800 5.800 6.400.9-4.600 4.500 1.100 6.400L12 17.400l-5.700 3 1.100-6.400L2.800 9.500l6.400-.9z" class="f" ' + S + '/>',
    crown: '<path d="M3 18.500l-.8-10 5.300 3.800L12 5l4.500 7.300 5.300-3.800-.8 10z" class="f" ' + S + '/>',
    sound: '<path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" class="f"/><path d="M15.500 9a4 4 0 010 6M18 6.500a7.500 7.500 0 010 11" fill="none" class="s" ' + S + '/>',
  };
  G.Zoo = G.Zoo || {};
  G.Zoo.icon = (n, cls) => '<svg class="ic ic-' + n + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + "</svg>";
})(window);
