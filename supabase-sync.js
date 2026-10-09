// supabase-sync.js
// Giữ nguyên cách lưu localStorage của script.js, đồng bộ thêm lên Supabase.
// Không cần sửa script.js: file này nạp script.js sau khi đã kéo dữ liệu từ Supabase về.
(() => {
  const PREFIX = "ql-cong-viec-";            // mọi key của app đều bắt đầu bằng tiền tố này
  const PENDING_KEY = "sb-pending-keys";     // key chờ đẩy lên (không đồng bộ chính nó)
  const TABLE = "app_state";

  const hasConfig = window.SUPABASE_URL && window.SUPABASE_KEY &&
    !/YOUR-/.test(window.SUPABASE_URL + window.SUPABASE_KEY);
  const nativeSet = Storage.prototype.setItem;

  let appLoaded = false;
  const loadApp = () => {
    if (appLoaded) return;
    appLoaded = true;
    const s = document.createElement("script");
    s.src = "script.js";
    document.body.appendChild(s);
  };

  // Chưa cấu hình hoặc không tải được thư viện: chạy như cũ (chỉ localStorage)
  if (!hasConfig || !window.supabase) {
    if (hasConfig) console.warn("Không tải được thư viện Supabase, chạy chế độ local.");
    loadApp();
    return;
  }

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  let user = null;

  // ===== Tiện ích localStorage =====
  const localKeys = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k);
    }
    return out;
  };
  const getPending = () => {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch (e) { return []; }
  };
  const setPending = (arr) => nativeSet.call(localStorage, PENDING_KEY, JSON.stringify([...new Set(arr)]));

  // ===== Trạng thái hiển thị =====
  const LABELS = { saving: "Đang lưu...", saved: "Đã đồng bộ", offline: "Offline, sẽ đồng bộ khi có mạng", error: "Lỗi đồng bộ" };
  let state = "saved";
  function setStatus(s) {
    state = s;
    const el = document.getElementById("syncStatus");
    if (!el) return;
    el.textContent = LABELS[s];
    el.style.color = s === "error" ? "#d93025" : "";
  }

  // ===== Đẩy dữ liệu lên Supabase =====
  async function pushKeys(keys) {
    const snapshot = keys.map((k) => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null);
    if (snapshot.length) {
      const rows = snapshot.map(([key, value]) => ({ user_id: user.id, key, value, updated_at: new Date().toISOString() }));
      const { error } = await sb.from(TABLE).upsert(rows, { onConflict: "user_id,key" });
      if (error) throw error;
    }
    // Chỉ bỏ cờ chờ nếu trong lúc đẩy không có thay đổi mới
    setPending(getPending().filter((k) => {
      const cur = localStorage.getItem(k);
      const sent = snapshot.find(([kk]) => kk === k);
      return !(cur === null || (sent && cur === sent[1]));
    }));
  }

  let flushing = false, rerun = false, retryTimer = null;
  async function flush() {
    if (flushing) { rerun = true; return; }
    const keys = getPending();
    if (!keys.length) return;
    if (!navigator.onLine) return setStatus("offline");
    flushing = true;
    setStatus("saving");
    try {
      await pushKeys(keys);
      setStatus("saved");
    } catch (e) {
      console.error("Lỗi đồng bộ Supabase:", e);
      setStatus("error");
      clearTimeout(retryTimer);
      retryTimer = setTimeout(flush, 15000);
    } finally {
      flushing = false;
      if (rerun) { rerun = false; flush(); }
    }
  }

  // ===== Kéo dữ liệu từ Supabase về localStorage (trước khi app chạy) =====
  async function hydrate() {
    const pending = getPending();
    const { data, error } = await sb.from(TABLE).select("key,value");
    if (error) throw error;
    const remote = new Map((data || []).map((r) => [r.key, r.value]));
    const local = localKeys();

    // Lần đầu (DB trống): đẩy toàn bộ dữ liệu đang có trên máy lên
    if (remote.size === 0) {
      if (local.length) await pushKeys(local);
      return;
    }
    // DB là bản chuẩn, trừ các key sửa lúc offline chưa kịp đẩy lên
    for (const [k, v] of remote) {
      if (k.startsWith(PREFIX) && !pending.includes(k)) nativeSet.call(localStorage, k, v);
    }
    const toPush = [...new Set([...pending, ...local.filter((k) => !remote.has(k))])];
    if (toPush.length) await pushKeys(toPush);
  }

  // ===== Móc vào localStorage.setItem: mỗi lần app lưu thì tự đẩy lên DB =====
  let timer = null;
  function installHook() {
    Storage.prototype.setItem = function (k, v) {
      nativeSet.call(this, k, v);
      if (this === localStorage && String(k).startsWith(PREFIX)) {
        setPending([...getPending(), k]);
        setStatus("saving");
        clearTimeout(timer);
        timer = setTimeout(flush, 800);
      }
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  }

  // ===== Giao diện: trạng thái + nút đăng xuất =====
  function addSyncUi() {
    const top = document.querySelector(".top");
    if (!top) return;
    const ref = document.getElementById("btnMgr");
    const span = document.createElement("span");
    span.id = "syncStatus";
    span.className = "hint";
    top.insertBefore(span, ref);
    const out = document.createElement("button");
    out.type = "button";
    out.textContent = "Đăng xuất";
    out.onclick = signOut;
    top.insertBefore(out, ref);
    setStatus(state);
  }

  async function signOut() {
    await flush();
    if (getPending().length && !confirm("Còn thay đổi chưa đồng bộ lên Supabase, đăng xuất sẽ làm mất chúng. Vẫn đăng xuất?")) return;
    [...localKeys(), PENDING_KEY].forEach((k) => localStorage.removeItem(k));
    await sb.auth.signOut();
    location.reload();
  }

  // ===== Hộp đăng nhập =====
  function showLogin() {
    return new Promise((resolve) => {
      const dlg = document.createElement("dialog");
      dlg.style.width = "min(420px, 94vw)";
      dlg.innerHTML = `
        <div class="dlg-head"><h2>Đăng nhập</h2></div>
        <form class="dlg-body" style="display:flex;flex-direction:column;gap:12px">
          <label>Email <input name="email" type="email" required autocomplete="username"></label>
          <label>Mật khẩu <input name="password" type="password" required autocomplete="current-password"></label>
          <p class="login-msg hint" role="alert" style="color:#d93025;margin:0"></p>
          <div class="actions"><button type="submit" class="primary">Đăng nhập</button></div>
        </form>`;
      dlg.addEventListener("cancel", (e) => e.preventDefault()); // không cho Esc tắt
      document.body.appendChild(dlg);
      dlg.showModal();
      dlg.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target, msg = dlg.querySelector(".login-msg"), btn = f.querySelector("button");
        btn.disabled = true;
        msg.textContent = "";
        const { data, error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
        btn.disabled = false;
        if (error) {
          msg.textContent = /invalid login/i.test(error.message) ? "Sai email hoặc mật khẩu." : error.message;
          return;
        }
        dlg.close();
        dlg.remove();
        resolve(data.session);
      });
    });
  }

  // ===== Khởi động =====
  async function start() {
    let { data: { session } } = await sb.auth.getSession();
    if (!session) session = await showLogin();
    user = session.user;
    try {
      await hydrate();
    } catch (e) {
      console.error("Không đọc được từ Supabase, dùng dữ liệu trên máy:", e);
      state = navigator.onLine ? "error" : "offline";
    }
    installHook();
    loadApp();
    addSyncUi();
    flush();
  }
  start().catch((e) => { console.error(e); loadApp(); });
})();
