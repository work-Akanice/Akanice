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
  const OWNER_KEY = "sb-owner";   // id tài khoản đã dùng trình duyệt này lần gần nhất (để không lẫn dữ liệu cá nhân)

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
  try {   // mở sẵn kết nối tới Supabase để truy vấn đầu tiên không phải chờ bắt tay TLS
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = window.SUPABASE_URL;
    document.head.appendChild(link);
  } catch (e) {}

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
    error: "Lỗi đồng bộ",
  };
  let state = "saved";
  function setStatus(s) {
    state = s;
    const el = document.getElementById("syncStatus");
    if (!el) return;
    el.textContent = LABELS[s];
    el.style.color = s === "error" ? "#d93025" : "";
  }

  // Báo cho app nạp lại dữ liệu từ localStorage và vẽ lại tại chỗ (không tải lại trang).
  // Nếu script.js chưa chạy thì không cần báo: lúc chạy nó sẽ đọc thẳng bản mới nhất trong localStorage.
  function notifyApp(keys) {
    if (!appLoaded || typeof window.APP_APPLY_REMOTE !== "function") return;
    try { window.APP_APPLY_REMOTE(keys); } catch (e) { console.error("Không áp dụng được cập nhật từ máy khác:", e); }
  }
  // Ghi bản đã merge vào localStorage và ghi nhận "máy này đang dựa trên bản server nào".
  // Toàn bộ là đồng bộ (không có await) nên không thể chen vào giữa một thao tác lưu của app.
  function adoptMerged(key, local, merged, metaEntry) {
    if (merged !== local) nativeSet.call(localStorage, key, merged);
    meta[key] = metaEntry;
    persistMeta();
    if (merged !== local) notifyApp([key]);
  }

  // ===== Dữ liệu CHUNG: đồng bộ 1 key =====
  async function syncShared(key, depth = 0, prefetched) {
    if (depth > 4) throw new Error("Xung đột liên tục, sẽ thử lại");
    let row = prefetched;
    if (row === undefined || depth > 0) {
      const { data, error } = await sb.from(T_SHARED).select("value,version").eq("key", key).maybeSingle();
      if (error) throw error;
      row = data;
    }
    // Đọc localStorage SAU khi chờ mạng: nếu người dùng vừa lưu thêm trong lúc chờ thì không bị ghi đè bằng bản cũ
    const local = localStorage.getItem(key);
    const m = meta[key];

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
      adoptMerged(key, local, row.value, { v: row.version, base: row.value });
      return;
    }

    if (row.version === m.v) {                    // server không đổi kể từ bản gốc
      if (local === null || local === m.base) return;
      return pushShared(key, local, row.version, local, depth);
    }

    // Server đã bị người khác sửa: trộn 3 bên, ghi bản trộn vào localStorage rồi báo app vẽ lại
    const mine = local === null ? m.base : local;
    const merged = mine === m.base ? row.value : mergeJson(m.base, mine, row.value);
    adoptMerged(key, local, merged, { v: row.version, base: row.value });
    // app có thể vừa sửa lại dữ liệu khi nhận cập nhật (vd. đánh lại STT): đẩy đúng bản hiện tại
    const toPush = localStorage.getItem(key);
    if (toPush !== null && toPush !== row.value) return pushShared(key, toPush, row.version, toPush, depth);
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

  // data: các dòng đã tải sẵn từ server (tải song song với các truy vấn khác ở start())
  async function hydrateShared(data) {
    const rows = new Map(data.map((r) => [r.key, r]));
    for (const key of SHARED_KEYS) await syncShared(key, 0, rows.get(key) || null);
  }

  // ===== Dữ liệu CÁ NHÂN (riêng từng tài khoản) =====
  // Cùng cơ chế trộn 3 bên như dữ liệu chung: nếu 2 thiết bị của cùng tài khoản sửa lệch nhau,
  // thay đổi của cả hai được gộp theo từng việc / từng ghi chú thay vì bên sau ghi đè bên trước.
  // Phiên bản dựa vào cột updated_at: chỉ ghi khi updated_at trên server vẫn đúng như lần đồng bộ trước.
  const emptyBase = (txt) => { try { return Array.isArray(JSON.parse(txt)) ? "[]" : "null"; } catch (e) { return "null"; } };

  async function syncPersonal(key, depth = 0, prefetched) {
    if (depth > 4) throw new Error("Xung đột liên tục, sẽ thử lại");
    let row = prefetched;
    if (row === undefined || depth > 0) {
      const { data, error } = await sb.from(T_PERSONAL).select("value,updated_at").eq("user_id", user.id).eq("key", key).maybeSingle();
      if (error) throw error;
      row = data;
    }
    const local = localStorage.getItem(key);      // đọc SAU khi chờ mạng (xem chú thích ở syncShared)
    const m = meta[key];

    if (!row) {                                   // server chưa có: đưa lên
      if (local === null) return;
      const { data, error } = await sb.from(T_PERSONAL)
        .insert({ user_id: user.id, key, value: local, updated_at: new Date().toISOString() }).select("updated_at");
      if (error) {
        if (error.code === "23505") return syncPersonal(key, depth + 1);   // thiết bị khác vừa tạo trước
        throw error;
      }
      meta[key] = { u: data && data[0] ? data[0].updated_at : null, base: local };
      persistMeta();
      return;
    }

    if (!m) {                                     // máy này chưa từng đồng bộ key này
      if (local === null || local === row.value) {
        adoptMerged(key, local, row.value, { u: row.updated_at, base: row.value });
        return;
      }
      // Cả máy này và server đều có dữ liệu: gộp (không bên nào bị mất), giữ bản máy này để dự phòng
      backup(key, local);
      const merged = mergeJson(emptyBase(local), local, row.value);
      adoptMerged(key, local, merged, { u: row.updated_at, base: row.value });
      return pushMergedPersonal(key, row, depth);
    }

    if (row.updated_at === m.u) {                 // server không đổi kể từ lần đồng bộ trước
      if (local === null || local === m.base) return;
      return pushPersonalRow(key, local, row.updated_at, local, depth);
    }

    // Thiết bị khác đã sửa: trộn 3 bên
    const mine = local === null ? m.base : local;
    const merged = mine === m.base ? row.value : mergeJson(m.base, mine, row.value);
    adoptMerged(key, local, merged, { u: row.updated_at, base: row.value });
    return pushMergedPersonal(key, row, depth);
  }

  // Đẩy bản hiện tại trong localStorage (sau merge, có thể đã được app chỉnh thêm) nếu khác server
  function pushMergedPersonal(key, row, depth) {
    const toPush = localStorage.getItem(key);
    if (toPush === null || toPush === row.value) return;
    return pushPersonalRow(key, toPush, row.updated_at, toPush, depth);
  }

  async function pushPersonalRow(key, value, expectedU, newBase, depth) {
    const { data, error } = await sb.from(T_PERSONAL)
      .update({ value, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("key", key).eq("updated_at", expectedU).select("updated_at");
    if (error) throw error;
    if (!data || !data.length) return syncPersonal(key, depth + 1);   // thiết bị khác vừa ghi trước: trộn lại
    if (newBase !== null) {
      meta[key] = { u: data[0].updated_at, base: newBase };
      persistMeta();
    }
  }

  async function hydratePersonal(data) {
    const rows = new Map(data.filter((r) => r.key.startsWith(PREFIX) && !isShared(r.key)).map((r) => [r.key, r]));
    const keys = new Set([...rows.keys(), ...localKeys().filter((k) => !isShared(k))]);
    for (const key of keys) await syncPersonal(key, 0, rows.get(key) || null);
    setPending(getPending().filter((k) => isShared(k)));
  }

  // ===== Đẩy dữ liệu khi app lưu + kéo thay đổi của người khác về =====
  const dirtyShared = new Set();
  const pullShared = new Set(), pullPersonal = new Set();   // key phát hiện đã đổi trên server
  let timer = null, flushing = false, rerun = false, retryTimer = null;
  let ready = false;   // true sau khi đồng bộ lần đầu xong; trước đó flush() chờ, các thay đổi vẫn được ghi nhớ trong dirtyShared / hàng chờ cá nhân

  async function flush() {
    if (!ready) return;
    if (flushing) { rerun = true; return; }
    const sharedKeys = [...new Set([...dirtyShared, ...pullShared])];
    const personal = [...new Set([...getPending().filter((k) => !isShared(k)), ...pullPersonal])];
    if (!sharedKeys.length && !personal.length) return;
    if (!navigator.onLine) return setStatus("offline");
    flushing = true;
    setStatus("saving");
    try {
      for (const k of sharedKeys) {
        dirtyShared.delete(k);
        pullShared.delete(k);
        try { await syncShared(k); } catch (e) { dirtyShared.add(k); throw e; }
      }
      for (const k of personal) {
        pullPersonal.delete(k);
        const before = localStorage.getItem(k);
        await syncPersonal(k);
        // bỏ khỏi hàng chờ nếu app không lưu thêm gì trong lúc đồng bộ (bản sau merge cũng tính là đã đẩy xong)
        const after = localStorage.getItem(k);
        if (after === before || (meta[k] && after === meta[k].base)) setPending(getPending().filter((x) => x !== k));
      }
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

  // ===== Nhận thay đổi của người khác: kéo về, merge, vẽ lại tại chỗ =====
  let checking = false;
  async function checkRemote() {
    if (checking) return;
    checking = true;
    try {
      const { data, error } = await sb.from(T_SHARED).select("key,version,device");
      if (!error && data) {
        data.forEach((r) => {
          if (isShared(r.key) && (meta[r.key] ? meta[r.key].v : 0) < r.version && r.device !== device) pullShared.add(r.key);
        });
      }
      if (!flushing && !getPending().length) {
        const { data: pr, error: pe } = await sb.from(T_PERSONAL).select("key,updated_at");
        if (!pe && pr) {
          pr.forEach((r) => {
            if (r.key.startsWith(PREFIX) && !isShared(r.key) && (!meta[r.key] || meta[r.key].u !== r.updated_at)) pullPersonal.add(r.key);
          });
        }
      }
    } catch (e) {
      // lỗi mạng: lần kiểm tra sau sẽ thử lại
    } finally {
      checking = false;
    }
    if (pullShared.size || pullPersonal.size) flush();
  }
  function subscribeRealtime() {
    try {
      sb.channel("shared-state")
        .on("postgres_changes", { event: "*", schema: "public", table: T_SHARED }, (p) => {
          if (p && p.new && p.new.device === device) return;   // bỏ qua thay đổi do chính máy này gửi
          checkRemote();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: T_PERSONAL, filter: `user_id=eq.${user.id}` }, () => {
          if (!flushing) checkRemote();
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
    const ref = document.getElementById("btnImport");
    const span = document.createElement("span");
    span.id = "syncStatus";
    span.className = "hint";
    top.insertBefore(span, ref);
    setStatus(state);
  }

  // ===== Gắn dữ liệu cá nhân với tài khoản =====
  // Nếu trình duyệt này từng dùng bởi tài khoản khác (vd. phiên hết hạn rồi người khác đăng nhập mà không bấm
  // "Đăng xuất"), dữ liệu cá nhân còn lại trên máy KHÔNG được đẩy sang tài khoản mới: xóa trước khi đồng bộ.
  // Dữ liệu chung của nhóm thì giữ lại vì mọi thành viên đều được xem.
  function purgePersonalData() {
    localKeys().filter((k) => !isShared(k)).forEach((k) => localStorage.removeItem(k));
    Object.keys(meta).forEach((k) => { if (!isShared(k)) delete meta[k]; });
    persistMeta();
    setPending(getPending().filter(isShared));
    try {
      const b = JSON.parse(localStorage.getItem(BACKUP_KEY)) || {};
      Object.keys(b).forEach((k) => { if (k !== "_at" && !isShared(k)) delete b[k]; });
      nativeSet.call(localStorage, BACKUP_KEY, JSON.stringify(b));
    } catch (e) { localStorage.removeItem(BACKUP_KEY); }
  }
  function bindOwner(userId) {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== userId) {
      console.info("Trình duyệt này đang giữ dữ liệu của tài khoản khác: đã xóa dữ liệu cá nhân cũ.");
      purgePersonalData();
    }
    if (owner !== userId) nativeSet.call(localStorage, OWNER_KEY, userId);
  }

  async function signOut() {
    await flush();
    if (dirtyShared.size || getPending().length) {
      const msg = "Còn thay đổi chưa đồng bộ lên Supabase, đăng xuất sẽ làm mất chúng. Vẫn đăng xuất?";
      const ok = window.askYesNo ? await window.askYesNo(msg) : confirm(msg);
      if (!ok) return;
    }
    [...localKeys(), PENDING_KEY, META_KEY, BACKUP_KEY, OWNER_KEY].forEach((k) => localStorage.removeItem(k));
    await sb.auth.signOut();
    location.reload();
  }
  window.SYNC_SIGNOUT = signOut;

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
  // Máy đã từng đồng bộ đúng tài khoản này ("warm"): mở app NGAY bằng dữ liệu đã lưu trên máy, việc đồng bộ chạy nền
  // và tự vẽ lại khi có thay đổi (3-way merge giữ nguyên chỉnh sửa của mình trong lúc chờ).
  // Lần đầu / đổi tài khoản: vẫn chờ đồng bộ xong rồi mới mở app để không hiện dữ liệu cũ hay sai người.
  async function start() {
    let { data: { session } } = await sb.auth.getSession();
    if (!session) session = await showLogin();
    user = session.user;
    const warm = localStorage.getItem(OWNER_KEY) === user.id && SHARED_KEYS.some((k) => meta[k]);
    bindOwner(user.id);   // phải chạy trước khi đồng bộ bất cứ thứ gì
    window.SYNC_USER = String(user.email || "").split("@")[0];

    // 3 truy vấn chạy song song (trước đây chạy nối đuôi nhau: thành viên -> dữ liệu chung -> dữ liệu cá nhân)
    const fetched = Promise.all([
      sb.from(T_MEMBERS).select("user_id").eq("user_id", user.id).maybeSingle(),
      sb.from(T_SHARED).select("key,value,version"),
      sb.from(T_PERSONAL).select("key,value,updated_at"),
    ]);
    const hydrate = async () => {
      try {
        const [member, shared, personal] = await fetched;
        if (member.error) throw member.error;
        if (!member.data) return false;
        if (shared.error) throw shared.error;
        if (personal.error) throw personal.error;
        await hydrateShared(shared.data || []);
        await hydratePersonal(personal.data || []);
      } catch (e) {
        console.error("Không đồng bộ được với Supabase, dùng dữ liệu trên máy:", e);
        state = navigator.onLine ? "error" : "offline";
      }
      return true;
    };
    const goLive = () => {
      ready = true;
      setStatus(state);
      subscribeRealtime();
      setInterval(() => { if (navigator.onLine && document.visibilityState === "visible") checkRemote(); }, 60000);
      flush();
    };

    if (warm) {
      installHook();
      loadApp();
      addSyncUi();
      if (await hydrate()) goLive(); else showNoAccess();
    } else {
      if (!(await hydrate())) return showNoAccess();
      installHook();
      loadApp();
      addSyncUi();
      goLive();
    }
  }
  start().catch((e) => { console.error(e); loadApp(); });
})();
