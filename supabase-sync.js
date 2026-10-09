// supabase-sync.js  (bản chia sẻ cho cả nhóm)
// - Giữ nguyên localStorage của script.js, không cần sửa script.js.
// - Dữ liệu chung của nhóm (công việc, danh mục, STT) nằm ở bảng shared_state, nhiều người cùng sửa;
//   khi 2 người sửa cùng lúc, hệ thống tự trộn thay đổi (theo từng công việc, từng ô) thay vì ghi đè.
// - Danh sách cá nhân và ghi chú vẫn là riêng của từng tài khoản (bảng app_state).
(() => {
  const PREFIX = "ql-cong-viec-";
  const SHARED_KEYS = [
    "ql-cong-viec-v1",                   // công việc
    "ql-cong-viec-cats-v1",              // danh mục (đầu mối, trạng thái, phụ trách)
    "ql-cong-viec-stt-bank-v1",
    "ql-cong-viec-stt-renumbered-v1",
    "ql-cong-viec-group-renumbered-v1",
  ];
  const T_SHARED = "shared_state", T_PERSONAL = "app_state", T_MEMBERS = "members";
  const META_KEY = "sb-meta", DEVICE_KEY = "sb-device", BACKUP_KEY = "sb-backup", PENDING_KEY = "sb-pending-keys";

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

  // Tên đăng nhập đơn giản (vd "tram") được đổi thành email ẩn "tram@<LOGIN_DOMAIN>" khi gửi lên Supabase
  const LOGIN_DOMAIN = window.SUPABASE_LOGIN_DOMAIN || "example.com";
  const toEmail = (name) => {
    const raw = String(name).trim().toLowerCase();
    if (raw.includes("@")) return raw;                      // vẫn cho đăng nhập bằng email đầy đủ
    return /^[a-z0-9._-]+$/.test(raw) ? raw + "@" + LOGIN_DOMAIN : null;
  };

  const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  let user = null;
  const isShared = (k) => SHARED_KEYS.includes(k);

  // <merge>
  // ===== Trộn 3 bên: base (bản gốc lần đồng bộ trước), local (của mình), remote (trên server) =====
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  const isPrim = (x) => x === null || typeof x !== "object";
  const hasId = (arr) => arr.every((x) => isObj(x) && x.id !== undefined && x.id !== null);

  function merge3(base, local, remote) {
    if (same(local, base)) return remote;      // mình không đổi gì: lấy bản của người khác
    if (same(remote, base)) return local;      // người khác không đổi gì: giữ bản của mình
    if (same(local, remote)) return local;
    if (isObj(local) && isObj(remote)) {       // object: trộn từng ô
      const b = isObj(base) ? base : {};
      const out = {};
      for (const k of new Set([...Object.keys(b), ...Object.keys(local), ...Object.keys(remote)])) {
        const v = merge3(b[k], local[k], remote[k]);
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
    if (Array.isArray(local) && Array.isArray(remote)) return mergeArrays(Array.isArray(base) ? base : [], local, remote);
    return local;                              // cùng sửa 1 giá trị: bản của mình thắng
  }

  function mergeArrays(base, local, remote) {
    if (hasId(local) && hasId(remote) && hasId(base)) {   // danh sách công việc: trộn theo id
      const idOf = (x) => String(x.id);
      const B = new Map(base.map((x) => [idOf(x), x]));
      const L = new Map(local.map((x) => [idOf(x), x]));
      const R = new Map(remote.map((x) => [idOf(x), x]));
      const out = [];
      for (const id of new Set([...remote.map(idOf), ...local.map(idOf), ...base.map(idOf)])) {
        const v = merge3(B.get(id), L.get(id), R.get(id));
        if (v !== undefined) out.push(v);
      }
      return out;
    }
    if (local.every(isPrim) && remote.every(isPrim) && base.every(isPrim)) {   // danh sách giá trị đơn
      const added = local.filter((x) => !base.includes(x));
      const removed = base.filter((x) => !local.includes(x));
      if (!added.length && !removed.length) return local;                     // chỉ đổi thứ tự: giữ thứ tự của mình
      return [...remote.filter((x) => !removed.includes(x)), ...added.filter((x) => !remote.includes(x))];
    }
    return local;
  }

  const mergeJson = (base, local, remote) => {
    try {
      return JSON.stringify(merge3(JSON.parse(base), JSON.parse(local), JSON.parse(remote)));
    } catch (e) { return local; }
  };
  // </merge>

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

  let device = localStorage.getItem(DEVICE_KEY);
  if (!device) {
    device = Math.random().toString(36).slice(2) + Date.now().toString(36);
    nativeSet.call(localStorage, DEVICE_KEY, device);
  }
  let meta = {};   // key -> { v: phiên bản server, base: nội dung server mà bộ nhớ của app đang dựa vào }
  try { meta = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) {}
  const persistMeta = () => nativeSet.call(localStorage, META_KEY, JSON.stringify(meta));
  function backup(key, value) {
    try {
      const b = JSON.parse(localStorage.getItem(BACKUP_KEY)) || {};
      b[key] = value;
      b._at = new Date().toISOString();
      nativeSet.call(localStorage, BACKUP_KEY, JSON.stringify(b));
    } catch (e) {}
  }

  // ===== Trạng thái hiển thị =====
  const LABELS = {
    saving: "Đang lưu...", saved: "Đã đồng bộ", offline: "Offline, sẽ đồng bộ khi có mạng",
    error: "Lỗi đồng bộ", update: "Có cập nhật mới, sẽ tự tải lại (bấm để tải ngay)",
  };
  let state = "saved";
  function setStatus(s) {
    state = s;
    const el = document.getElementById("syncStatus");
    if (!el) return;
    el.textContent = LABELS[s];
    el.style.color = s === "error" ? "#d93025" : "";
    el.style.cursor = s === "update" ? "pointer" : "";
  }

  let needReload = false;

  // ===== Dữ liệu CHUNG: đồng bộ 1 key =====
  async function syncShared(key, depth = 0, prefetched) {
    if (depth > 4) throw new Error("Xung đột liên tục, sẽ thử lại");
    const local = localStorage.getItem(key);
    const m = meta[key];
    let row = prefetched;
    if (row === undefined || depth > 0) {
      const { data, error } = await sb.from(T_SHARED).select("value,version").eq("key", key).maybeSingle();
      if (error) throw error;
      row = data;
    }

    if (!row) {                                   // server chưa có key này: đưa lên
      if (local === null) return;
      const { error } = await sb.from(T_SHARED).insert({ key, value: local, version: 1, updated_by: user.id, device });
      if (error) {
        if (error.code === "23505") return syncShared(key, depth + 1);   // có người vừa tạo trước
        throw error;
      }
      meta[key] = { v: 1, base: local };
      persistMeta();
      return;
    }

    if (!m) {                                     // máy này chưa từng đồng bộ key này: lấy bản của server
      if (local !== null && local !== row.value) backup(key, local);
      nativeSet.call(localStorage, key, row.value);
      meta[key] = { v: row.version, base: row.value };
      persistMeta();
      if (appLoaded) needReload = true;
      return;
    }

    if (row.version === m.v) {                    // server không đổi kể từ bản gốc
      if (local === null || local === m.base) return;
      return pushShared(key, local, row.version, local, depth);
    }

    // Server đã bị người khác sửa: trộn 3 bên
    const mine = local === null ? m.base : local;
    const merged = mine === m.base ? row.value : mergeJson(m.base, mine, row.value);
    if (!appLoaded) {
      // Lúc khởi động: ghi bản trộn vào localStorage, app sẽ nạp đúng bản này
      if (merged !== local) nativeSet.call(localStorage, key, merged);
      if (merged !== row.value) return pushShared(key, merged, row.version, merged, depth);
      meta[key] = { v: row.version, base: merged };
      persistMeta();
      return;
    }
    // Đang chạy: bộ nhớ của app đang giữ bản cũ nên KHÔNG ghi đè localStorage.
    // Chỉ đẩy bản đã trộn lên server rồi tải lại trang để app nạp bản mới.
    needReload = true;
    if (merged !== row.value) return pushShared(key, merged, row.version, null, depth);
  }

  async function pushShared(key, value, expectedV, newBase, depth) {
    const { data, error } = await sb.from(T_SHARED)
      .update({ value, version: expectedV + 1, updated_at: new Date().toISOString(), updated_by: user.id, device })
      .eq("key", key).eq("version", expectedV).select("version");
    if (error) throw error;
    if (!data || !data.length) return syncShared(key, depth + 1);   // có người vừa ghi trước: trộn lại
    if (newBase !== null) {
      meta[key] = { v: expectedV + 1, base: newBase };
      persistMeta();
    }
  }

  async function hydrateShared() {
    const { data, error } = await sb.from(T_SHARED).select("key,value,version");
    if (error) throw error;
    const rows = new Map((data || []).map((r) => [r.key, r]));
    for (const key of SHARED_KEYS) await syncShared(key, 0, rows.get(key) || null);
  }

  // ===== Dữ liệu CÁ NHÂN (riêng từng tài khoản) =====
  async function pushPersonal(keys) {
    const snapshot = keys.map((k) => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null);
    if (snapshot.length) {
      const rows = snapshot.map(([key, value]) => ({ user_id: user.id, key, value, updated_at: new Date().toISOString() }));
      const { error } = await sb.from(T_PERSONAL).upsert(rows, { onConflict: "user_id,key" });
      if (error) throw error;
    }
    setPending(getPending().filter((k) => {
      const cur = localStorage.getItem(k);
      const sent = snapshot.find(([kk]) => kk === k);
      return !(cur === null || (sent && cur === sent[1]));
    }));
  }

  async function hydratePersonal() {
    const { data, error } = await sb.from(T_PERSONAL).select("key,value");
    if (error) throw error;
    const remote = new Map((data || []).filter((r) => r.key.startsWith(PREFIX) && !isShared(r.key)).map((r) => [r.key, r.value]));
    const pending = getPending().filter((k) => !isShared(k));
    const local = localKeys().filter((k) => !isShared(k));
    if (remote.size === 0) {
      if (local.length) await pushPersonal(local);
      return;
    }
    for (const [k, v] of remote) if (!pending.includes(k)) nativeSet.call(localStorage, k, v);
    const toPush = [...new Set([...pending, ...local.filter((k) => !remote.has(k))])];
    if (toPush.length) await pushPersonal(toPush);
  }

  // ===== Đẩy dữ liệu khi app lưu =====
  const dirtyShared = new Set();
  let timer = null, flushing = false, rerun = false, retryTimer = null;

  async function flush() {
    if (flushing) { rerun = true; return; }
    const sharedKeys = [...dirtyShared];
    const personal = getPending().filter((k) => !isShared(k));
    if (!sharedKeys.length && !personal.length) { if (needReload) scheduleReload(); return; }
    if (!navigator.onLine) return setStatus("offline");
    flushing = true;
    setStatus("saving");
    try {
      for (const k of sharedKeys) {
        dirtyShared.delete(k);
        try { await syncShared(k); } catch (e) { dirtyShared.add(k); throw e; }
      }
      if (personal.length) await pushPersonal(personal);
      setStatus(needReload ? "update" : "saved");
    } catch (e) {
      console.error("Lỗi đồng bộ Supabase:", e);
      setStatus("error");
      clearTimeout(retryTimer);
      retryTimer = setTimeout(flush, 15000);
    } finally {
      flushing = false;
      if (rerun) { rerun = false; flush(); } else if (needReload) scheduleReload();
    }
  }

  // ===== Nhận thay đổi của người khác =====
  let reloadTimer = null;
  const busy = () =>
    !!document.querySelector("dialog[open]") ||
    /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement && document.activeElement.tagName) || "") ||
    dirtyShared.size > 0 || flushing;
  function scheduleReload() {
    setStatus("update");
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(tryReload, 1500);
  }
  function tryReload() {
    if (busy()) { reloadTimer = setTimeout(tryReload, 3000); return; }
    location.reload();
  }
  async function checkRemote() {
    try {
      const { data, error } = await sb.from(T_SHARED).select("key,version,device");
      if (error || !data) return;
      if (data.some((r) => isShared(r.key) && (meta[r.key] ? meta[r.key].v : 0) < r.version && r.device !== device)) {
        needReload = true;
        scheduleReload();
      }
    } catch (e) {}
  }
  function subscribeRealtime() {
    try {
      sb.channel("shared-state")
        .on("postgres_changes", { event: "*", schema: "public", table: T_SHARED }, (p) => {
          if (p && p.new && p.new.device === device) return;   // bỏ qua thay đổi do chính máy này gửi
          checkRemote();
        })
        .subscribe();
    } catch (e) { console.warn("Không bật được cập nhật tức thời:", e); }
  }

  function installHook() {
    Storage.prototype.setItem = function (k, v) {
      nativeSet.call(this, k, v);
      if (this === localStorage && String(k).startsWith(PREFIX)) {
        if (isShared(k)) dirtyShared.add(k); else setPending([...getPending(), k]);
        setStatus("saving");
        clearTimeout(timer);
        timer = setTimeout(flush, 800);
      }
    };
    window.addEventListener("online", () => { flush(); checkRemote(); });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush(); else checkRemote();
    });
  }

  // ===== Giao diện: trạng thái + nút đăng xuất =====
  function addSyncUi() {
    const top = document.querySelector(".top");
    if (!top) return;
    const ref = document.getElementById("btnMgr");
    const span = document.createElement("span");
    span.id = "syncStatus";
    span.className = "hint";
    span.onclick = () => { if (state === "update") location.reload(); };
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
    if ((dirtyShared.size || getPending().length) && !confirm("Còn thay đổi chưa đồng bộ lên Supabase, đăng xuất sẽ làm mất chúng. Vẫn đăng xuất?")) return;
    [...localKeys(), PENDING_KEY, META_KEY, BACKUP_KEY].forEach((k) => localStorage.removeItem(k));
    await sb.auth.signOut();
    location.reload();
  }

  // ===== Hộp thoại =====
  function makeDialog(title, bodyHtml) {
    const dlg = document.createElement("dialog");
    dlg.style.width = "min(420px, 94vw)";
    dlg.innerHTML = `<div class="dlg-head"><h2>${title}</h2></div>
      <form class="dlg-body" style="display:flex;flex-direction:column;gap:12px">${bodyHtml}</form>`;
    dlg.addEventListener("cancel", (e) => e.preventDefault());   // không cho Esc tắt
    document.body.appendChild(dlg);
    dlg.showModal();
    return dlg;
  }

  function showLogin() {
    return new Promise((resolve) => {
      const dlg = makeDialog("Đăng nhập", `
        <label>Tên đăng nhập <input name="username" type="text" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
        <label>Mật khẩu <input name="password" type="password" required autocomplete="current-password"></label>
        <p class="login-msg hint" role="alert" style="color:#d93025;margin:0"></p>
        <div class="actions"><button type="submit" class="primary">Đăng nhập</button></div>`);
      dlg.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target, msg = dlg.querySelector(".login-msg"), btn = f.querySelector("button");
        const email = toEmail(f.username.value);
        if (!email) { msg.textContent = "Tên đăng nhập chỉ gồm chữ không dấu, số và các ký tự . _ -"; return; }
        btn.disabled = true;
        msg.textContent = "";
        const { data, error } = await sb.auth.signInWithPassword({ email, password: f.password.value });
        btn.disabled = false;
        if (error) {
          msg.textContent = /invalid login/i.test(error.message) ? "Sai tên đăng nhập hoặc mật khẩu." : error.message;
          return;
        }
        dlg.close();
        dlg.remove();
        resolve(data.session);
      });
    });
  }

  function showNoAccess() {
    const dlg = makeDialog("Chưa có quyền truy cập", `
      <p style="margin:0">Tài khoản này đăng nhập được nhưng chưa được thêm vào nhóm. Hãy nhờ quản trị viên thêm tài khoản vào danh sách thành viên.</p>
      <div class="actions"><button type="submit" class="primary">Đăng xuất</button></div>`);
    dlg.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      await sb.auth.signOut();
      location.reload();
    });
  }

  // ===== Khởi động =====
  async function start() {
    let { data: { session } } = await sb.auth.getSession();
    if (!session) session = await showLogin();
    user = session.user;
    try {
      const { data: member, error } = await sb.from(T_MEMBERS).select("user_id").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (!member) return showNoAccess();
      await hydrateShared();
      await hydratePersonal();
    } catch (e) {
      console.error("Không đồng bộ được với Supabase, dùng dữ liệu trên máy:", e);
      state = navigator.onLine ? "error" : "offline";
    }
    installHook();
    loadApp();
    addSyncUi();
    subscribeRealtime();
    flush();
  }
  start().catch((e) => { console.error(e); loadApp(); });
})();
