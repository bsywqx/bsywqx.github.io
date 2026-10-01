/* ============================================================
 *  合成大奶龙 · 内置作弊面板
 *  纯前端，随页面加载注入，不依赖任何浏览器插件。
 *  通过 window.__DNW__ 这个调试句柄操作游戏状态。
 * ============================================================ */
(function () {
  'use strict';

  /* 等 game.js 的调试句柄就绪 */
  function waitForGame(cb, tries) {
    tries = tries || 100;
    if (window.__DNW__) { cb(); return; }
    if (tries <= 0) return;
    setTimeout(function () { waitForGame(cb, tries - 1); }, 120);
  }

  function injectCSS() {
    const css = document.createElement('style');
    css.textContent = [
      '#cheat-fab{position:fixed;right:14px;bottom:14px;z-index:99998;width:46px;height:46px;',
      'border-radius:50%;border:none;background:linear-gradient(135deg,#5b5b6b,#2b2b38);',
      'color:#ffd54f;font-size:20px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);',
      'display:flex;align-items:center;justify-content:center;user-select:none}',
      '#cheat-fab:hover{transform:scale(1.08)}',
      '#cheat-panel{position:fixed;right:14px;bottom:68px;z-index:99999;width:230px;',
      'background:rgba(22,22,30,.94);color:#eee;border-radius:14px;padding:14px;',
      'font:13px/1.7 "Microsoft YaHei",system-ui,sans-serif;box-shadow:0 10px 34px rgba(0,0,0,.5);',
      'user-select:none;display:none}',
      '#cheat-panel.show{display:block}',
      '#cheat-panel .t{font-weight:700;font-size:14px;color:#ffd54f;margin-bottom:8px;',
      'display:flex;justify-content:space-between;align-items:center}',
      '#cheat-panel .x{cursor:pointer;color:#888;font-size:16px;padding:0 4px}',
      '#cheat-panel label{display:flex;align-items:center;gap:6px;margin:5px 0;cursor:pointer}',
      '#cheat-panel input[type=checkbox]{accent-color:#ffb300}',
      '#cheat-panel select{width:100%;margin:4px 0;padding:4px 6px;background:#333;color:#eee;',
      'border:1px solid #555;border-radius:6px;font-size:12px}',
      '#cheat-panel .row{display:flex;gap:6px;margin:6px 0}',
      '#cheat-panel .row input[type=number]{flex:1;min-width:0;padding:4px 6px;background:#333;',
      'color:#eee;border:1px solid #555;border-radius:6px;font-size:12px}',
      '#cheat-panel button.mini{flex:0 0 auto;padding:4px 10px;border:none;border-radius:6px;',
      'background:linear-gradient(135deg,#ffb300,#f78f00);color:#3a2500;font-weight:700;',
      'cursor:pointer;font-size:12px}',
      '#cheat-panel button.mini:active{transform:scale(.96)}',
      '#cheat-panel .sep{border:none;border-top:1px solid rgba(255,255,255,.12);margin:9px 0}',
      '#cheat-panel .note{font-size:11px;color:#8a8a96;line-height:1.5}'
    ].join('');
    document.head.appendChild(css);
  }

  function buildPanel() {
    injectCSS();
    const DNW = window.__DNW__;

    const fab = document.createElement('button');
    fab.id = 'cheat-fab';
    fab.title = '作弊面板';
    fab.textContent = '⚙️';

    const panel = document.createElement('div');
    panel.id = 'cheat-panel';
    panel.innerHTML =
      '<div class="t"><span>🎮 作弊面板</span><span class="x">✕</span></div>' +
      '<label><input type="checkbox" id="ch-god">🛡 无敌·自动复活</label>' +
      '<label><input type="checkbox" id="ch-coin">💰 复活币无限</label>' +
      '<label style="margin-top:4px">🍉 固定下一个奶龙</label>' +
      '<select id="ch-fruit"></select>' +
      '<hr class="sep">' +
      '<div class="row">' +
      '  <input type="number" id="ch-score" value="100" min="1" step="1">' +
      '  <button class="mini" id="ch-add">➕加分</button>' +
      '</div>' +
      '<div class="row">' +
      '  <button class="mini" id="ch-clear" style="flex:1">🧹清空棋盘</button>' +
      '</div>' +
      '<hr class="sep">' +
      '<label><input type="checkbox" id="ch-board" checked>📤 提交成绩到排行榜</label>' +
      '<p class="note">排行榜已连独立账号 masud，不会影响原版榜单。关掉则不提交本局成绩。</p>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const $ = function (id) { return document.getElementById(id); };

    /* 固定水果下拉框：用 FRUITS 的名字 */
    const sel = $('ch-fruit');
    const none = document.createElement('option');
    none.value = '-1'; none.textContent = '随机（关闭）';
    sel.appendChild(none);
    (DNW.FRUITS || []).forEach(function (f, i) {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = (i + 1) + ' · ' + f.name;
      sel.appendChild(o);
    });

    /* 展开 / 收起 */
    fab.addEventListener('click', function () {
      panel.classList.toggle('show');
    });
    const xBtn = panel.querySelector('.x');
    xBtn.addEventListener('click', function () { panel.classList.remove('show'); });

    /* 排行榜开关：默认开（因为已是独立榜），关掉则顶掉自动提交 */
    const origOnGameOver = (window.DanaiwaBoard && window.DanaiwaBoard.onGameOver) || null;
    function applyBoard(off) {
      if (!window.DanaiwaBoard) return;
      if (off) {
        window.DanaiwaBoard.onGameOver = function () {
          const box = document.getElementById('submitBox');
          if (box) box.style.display = 'none';
        };
      } else if (origOnGameOver) {
        window.DanaiwaBoard.onGameOver = origOnGameOver;
      }
    }

    /* 加分 */
    $('ch-add').addEventListener('click', function () {
      const n = parseInt($('ch-score').value, 10);
      if (!isFinite(n) || n <= 0) return;
      if (DNW.addScore) DNW.addScore(n, DNW.state && DNW.state.aimX, 300, '+' + n);
      else DNW.state.score += n;
    });

    /* 清空棋盘 */
    $('ch-clear').addEventListener('click', function () {
      if (DNW.reset) DNW.reset();
    });

    /* 主循环：每 120ms 应用一次开关状态 */
    setInterval(function () {
      const st = DNW.state;
      if (!st) return;

      const god = $('ch-god').checked;
      const coin = $('ch-coin').checked;
      const board = $('ch-board').checked;

      if (coin && st.revives < 3) {
        st.revives = 3;
        if (DNW.paintRevives) DNW.paintRevives(true);
      }

      if (god) {
        if (st.revives < 1) {
          st.revives = 1;
          if (DNW.paintRevives) DNW.paintRevives(true);
        }
        if (st.over && DNW.revive) DNW.revive();
      }

      const tier = sel.value === '-1' ? null : Number(sel.value);
      if (tier !== null) {
        if (st.next !== tier) st.next = tier;
        if (st.pending !== tier) st.pending = tier;
      }

      applyBoard(!board);
    }, 120);
  }

  waitForGame(buildPanel);
})();
