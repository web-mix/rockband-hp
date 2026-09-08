/* ============================================================
 * RockBand(仮) メンバーチャットウィジェット — バンドHP統合版
 * 日替わりで当番メンバーが交代します(日本時間0時、api/chat.js と同じ計算式)。
 * 配色・フォントはHP本体(index.html)のトークンに合わせています:
 *   night-deep #070B1E / night-blue #101A3F / ultramarine #26397A
 *   starlight #C9D9FF / bird-blue #7FA9F2 / dawn-gold #E9CE93
 * index.html 側で読み込み済みの Shippori Mincho / Zen Kaku Gothic New を使用。
 * ============================================================ */
(function () {
  "use strict";

  // ------- 日替わり当番(api/chat.js と同じロジック) -------
  var ROTATION = ["kanato", "shogo", "gaku", "yuichi"];
  var MEMBERS = {
    kanato: {
      name: "カナト",
      role: "Vo.",
      firstMessage:
        "……来てくれたんだ。俺はカナト。RockBand(仮)でボーカルやってる。\n今日は俺が店番。なんか聞きたいことあれば、どうぞ。",
    },
    shogo: {
      name: "ショウゴ",
      role: "Gt.",
      firstMessage:
        "おう、来たか。俺はショウゴ、ギター弾いてる。今日は俺が当番なんだと。\n曲のことでもライブのことでも、なんでも聞けよ。",
    },
    gaku: {
      name: "ガク",
      role: "Ba.",
      firstMessage:
        "……どうも。ベースのガクです。今日の当番は僕らしい。\n口数は多くないけど、質問には答える。曲の構造の話なら、少し長くなるかもしれない。",
    },
    yuichi: {
      name: "ユウイチ",
      role: "Dr.",
      firstMessage:
        "よっ、来てくれてありがとな! ドラムのユウイチです、今日は俺の番!\nバンドのこと、新曲のこと、なんでも聞いてくれよ!",
    },
  };
  var todayId = ROTATION[Math.floor((Date.now() + 9 * 3600 * 1000) / 86400000) % ROTATION.length];
  var today = MEMBERS[todayId];

  var cfg = Object.assign(
    {
      apiUrl: "/api/chat",
      artistName: today.name,
      artistRole: today.role,
      bandName: "RockBand(仮)",
      firstMessage: today.firstMessage,
      buttonLabel: "今日は" + today.name + "と話せる",
    },
    window.BAND_CHAT_CONFIG || {}
  );

  // 当番が変わったら履歴もリセット(昨日の会話を別メンバーが引き継がないように)
  var STORAGE_KEY = "band_chat_history_v1_" + todayId;
  var MAX_INPUT = 1000;

  // ------- 履歴 (タブを閉じるまで保持) -------
  var messages = [];
  try {
    var saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) messages = JSON.parse(saved);
  } catch (e) {}
  if (!Array.isArray(messages) || messages.length === 0) {
    messages = [{ role: "assistant", content: cfg.firstMessage }];
  }
  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }

  // ------- スタイル(HPトークン準拠) -------
  var css = `
  .kw-root { --kw-deep:#070B1E; --kw-night:#101A3F; --kw-ultra:#26397A; --kw-star:#C9D9FF;
    --kw-bird:#7FA9F2; --kw-gold:#E9CE93; --kw-ink:#E8EDFB; --kw-dim:rgba(232,237,251,0.6);
    --kw-line:rgba(201,217,255,0.16);
    position:fixed; right:20px; bottom:20px; z-index:99999;
    font-family:'Zen Kaku Gothic New','Hiragino Kaku Gothic ProN',sans-serif; font-weight:400; }

  .kw-fab { display:flex; align-items:center; gap:10px;
    background:linear-gradient(140deg, var(--kw-ultra), #3D5AAE);
    color:var(--kw-ink); border:1px solid rgba(127,169,242,0.45); border-radius:999px;
    padding:13px 22px; font-size:13.5px; letter-spacing:0.14em; cursor:pointer;
    box-shadow:0 8px 30px rgba(7,11,30,0.7), 0 0 24px rgba(127,169,242,0.18);
    font-family:'Shippori Mincho',serif; font-weight:500; }
  .kw-fab:hover { filter:brightness(1.12); }
  .kw-fab:focus-visible, .kw-btn:focus-visible, .kw-send:focus-visible { outline:2px solid var(--kw-bird); outline-offset:2px; }
  .kw-fab .kw-dot { width:7px; height:7px; border-radius:50%; background:var(--kw-gold);
    box-shadow:0 0 9px rgba(233,206,147,0.9); }

  .kw-panel { position:fixed; right:20px; bottom:20px; width:min(380px, calc(100vw - 24px));
    height:min(560px, calc(100vh - 48px)); background:var(--kw-deep); border:1px solid var(--kw-line);
    border-radius:18px; display:none; flex-direction:column; overflow:hidden;
    box-shadow:0 24px 70px rgba(0,0,0,0.6); }
  .kw-panel.kw-open { display:flex; }

  .kw-hdr { display:flex; align-items:center; gap:11px; padding:14px 16px;
    background:var(--kw-night); border-bottom:1px solid var(--kw-line); }
  .kw-avatar { width:38px; height:38px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(145deg, var(--kw-ultra), var(--kw-deep));
    border:1px solid rgba(127,169,242,0.5);
    display:flex; align-items:center; justify-content:center; color:var(--kw-bird); font-size:16px; }
  .kw-name { color:var(--kw-ink); font-family:'Shippori Mincho',serif; font-weight:600;
    font-size:15.5px; letter-spacing:0.16em; line-height:1.2; }
  .kw-band { color:var(--kw-dim); font-size:10px; letter-spacing:0.22em; margin-top:3px; }
  .kw-hdr-btns { margin-left:auto; display:flex; gap:6px; }
  .kw-btn { background:transparent; border:1px solid var(--kw-line); color:var(--kw-dim);
    border-radius:8px; font-size:11px; padding:6px 10px; cursor:pointer; font-family:inherit; letter-spacing:0.06em; }
  .kw-btn:hover { color:var(--kw-ink); border-color:rgba(127,169,242,0.4); }

  .kw-feed { flex:1; overflow-y:auto; padding:16px 14px; display:flex; flex-direction:column; gap:11px;
    background: radial-gradient(420px 240px at 85% 0%, rgba(38,57,122,0.35), transparent 65%), var(--kw-deep); }
  .kw-row { display:flex; }
  .kw-row.kw-user { justify-content:flex-end; }
  .kw-bubble { max-width:82%; padding:9px 13px; border-radius:13px; font-size:13.5px;
    line-height:1.85; letter-spacing:0.04em; white-space:pre-wrap; word-break:break-word; color:var(--kw-ink); }
  .kw-bubble.kw-kanato { background:rgba(16,26,63,0.85); border:1px solid var(--kw-line); border-top-left-radius:4px; }
  .kw-bubble.kw-user-b { background:linear-gradient(140deg, var(--kw-ultra), #4C6FD1);
    color:#F0F5FF; border-top-right-radius:4px; }
  .kw-who { font-size:9.5px; color:var(--kw-bird); letter-spacing:0.22em; margin-bottom:4px;
    font-family:'Shippori Mincho',serif; }

  .kw-eq { display:flex; gap:3px; align-items:flex-end; height:14px; padding:3px 2px; }
  .kw-eq span { width:3px; background:var(--kw-bird); border-radius:2px; animation:kw-eq 0.9s ease-in-out infinite; }
  .kw-eq span:nth-child(2){animation-delay:.15s} .kw-eq span:nth-child(3){animation-delay:.3s} .kw-eq span:nth-child(4){animation-delay:.45s}
  @keyframes kw-eq { 0%,100%{height:4px} 50%{height:12px} }
  @media (prefers-reduced-motion: reduce){ .kw-eq span{animation:none;height:7px} }

  .kw-err { color:#F2A6A6; font-size:11.5px; padding:0 16px 6px; }
  .kw-composer { display:flex; gap:8px; padding:11px 12px 13px; background:var(--kw-night); border-top:1px solid var(--kw-line); }
  .kw-input { flex:1; resize:none; background:var(--kw-deep); color:var(--kw-ink); border:1px solid var(--kw-line);
    border-radius:11px; padding:10px 12px; font-family:inherit; font-size:16px; line-height:1.5; height:44px; max-height:110px; }
  .kw-input::placeholder { color:var(--kw-dim); }
  .kw-input:focus { outline:none; border-color:rgba(127,169,242,0.6); }
  .kw-send { background:linear-gradient(140deg, var(--kw-ultra), #4C6FD1); color:#F0F5FF; border:none; border-radius:11px;
    padding:0 17px; font-size:13px; cursor:pointer; font-family:'Shippori Mincho',serif; font-weight:600; letter-spacing:0.1em; }
  .kw-send:disabled { opacity:.45; cursor:default; }
  `;

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ------- DOM構築 -------
  var root = document.createElement("div");
  root.className = "kw-root";
  root.innerHTML =
    '<button class="kw-fab" type="button" aria-haspopup="dialog">' +
    '<span class="kw-dot" aria-hidden="true"></span>' +
    esc(cfg.buttonLabel) +
    "</button>" +
    '<div class="kw-panel" role="dialog" aria-label="' + esc(cfg.artistName) + 'とのチャット">' +
    '  <div class="kw-hdr">' +
    '    <div class="kw-avatar" aria-hidden="true">◆</div>' +
    "    <div>" +
    '      <div class="kw-name">' + esc(cfg.artistName) + "</div>" +
    '      <div class="kw-band">' + esc(cfg.bandName) + " — " + esc(cfg.artistRole) + " ・ 今日の当番</div>" +
    "    </div>" +
    '    <div class="kw-hdr-btns">' +
    '      <button class="kw-btn kw-clear" type="button">リセット</button>' +
    '      <button class="kw-btn kw-close" type="button" aria-label="閉じる">✕</button>' +
    "    </div>" +
    "  </div>" +
    '  <div class="kw-feed" aria-live="polite"></div>' +
    '  <div class="kw-err" hidden></div>' +
    '  <div class="kw-composer">' +
    '    <textarea class="kw-input" placeholder="' + esc(cfg.artistName) + 'にメッセージを送る…" maxlength="' + MAX_INPUT + '"></textarea>' +
    '    <button class="kw-send" type="button">送信</button>' +
    "  </div>" +
    "</div>";
  document.body.appendChild(root);

  var fab = root.querySelector(".kw-fab");
  var panel = root.querySelector(".kw-panel");
  var feed = root.querySelector(".kw-feed");
  var errEl = root.querySelector(".kw-err");
  var inputEl = root.querySelector(".kw-input");
  var sendBtn = root.querySelector(".kw-send");
  var loading = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var html = "";
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (m.role === "user") {
        html += '<div class="kw-row kw-user"><div class="kw-bubble kw-user-b">' + esc(m.content) + "</div></div>";
      } else {
        html +=
          '<div class="kw-row"><div class="kw-bubble kw-kanato"><div class="kw-who">' +
          esc(cfg.artistName) +
          "</div>" +
          esc(m.content) +
          "</div></div>";
      }
    }
    if (loading) {
      html +=
        '<div class="kw-row"><div class="kw-bubble kw-kanato"><div class="kw-who">' +
        esc(cfg.artistName) +
        '</div><div class="kw-eq" aria-label="入力中"><span></span><span></span><span></span><span></span></div></div></div>';
    }
    feed.innerHTML = html;
    feed.scrollTop = feed.scrollHeight;
  }

  function setError(msg) {
    if (msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
    } else {
      errEl.hidden = true;
    }
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text || loading) return;
    setError(null);
    messages.push({ role: "user", content: text });
    inputEl.value = "";
    loading = true;
    sendBtn.disabled = true;
    render();

    fetch(cfg.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("bad status " + r.status);
        return r.json();
      })
      .then(function (data) {
        var reply = (data && data.reply) || "";
        messages.push({
          role: "assistant",
          content: reply || "……ごめん、ちょっと電波が悪いみたいだ。もう一回言ってくれる?",
        });
        persist();
      })
      .catch(function () {
        messages.pop();
        inputEl.value = text;
        setError("接続に失敗しました。もう一度送信してください。");
      })
      .finally(function () {
        loading = false;
        sendBtn.disabled = false;
        render();
      });
  }

  // ------- イベント -------
  fab.addEventListener("click", function () {
    panel.classList.add("kw-open");
    fab.style.display = "none";
    render();
    inputEl.focus();
  });
  root.querySelector(".kw-close").addEventListener("click", function () {
    panel.classList.remove("kw-open");
    fab.style.display = "";
  });
  root.querySelector(".kw-clear").addEventListener("click", function () {
    messages = [{ role: "assistant", content: cfg.firstMessage }];
    persist();
    render();
  });
  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });
})();
