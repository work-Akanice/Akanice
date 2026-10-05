// ===== Danh mục: muốn thêm/bớt lựa chọn thì sửa ở đây =====
let DAU_MOI = {
  "Điều dưỡng": "red", "TCKT": "yellow", "KHTH": "green", "CNTT": "dark", "Cấp cứu": "orange",
};
let TRANG_THAI = {
  "Đã rõ yêu cầu": "blue", "Chờ ký": "purple", "Chưa làm rõ": "red", "Done": "green",
};
let DA_XONG = ["Done"]; // trạng thái coi là đã xong (không tính trễ)
let PHU_TRACH = [];

// ===== Dữ liệu =====
const KEY = "ql-cong-viec-v1";
const STT_BANK_KEY = "ql-cong-viec-stt-bank-v1";
const STT_RENUMBER_KEY = "ql-cong-viec-stt-renumbered-v1";
const STT_GROUP_RENUMBER_KEY = "ql-cong-viec-group-renumbered-v1";
const LIST_KEY = "ql-cong-viec-personal-list-v1";
const NOTES_KEY = "ql-cong-viec-notes-v1";
const sample = [
  { id: 1, stt: 15, dauMoi: ["Điều dưỡng"], maBV: "CR14", noiDung: "Cửa sổ nhập liệu theo quy trình làm việc Điều dưỡng", ghiChu: "", quiTrinh: false, ngayHop: "", deadline: "2026-10-30", status: "Đã rõ yêu cầu", phuTrach: "", logYC: "", bienBan: "" },
  { id: 2, stt: 16, dauMoi: ["Điều dưỡng"], maBV: "", noiDung: "Cửa sổ tiếp nhận", ghiChu: "Hoàn thành", quiTrinh: false, ngayHop: "", deadline: "", status: "Chờ ký", phuTrach: "Trâm", logYC: "", bienBan: "" },
  { id: 3, stt: 20, dauMoi: ["Điều dưỡng"], maBV: "CR14", noiDung: "Cửa sổ thực hiện", ghiChu: "Deadline 30/10 do liên quan đến việc cần thay đổi trạng thái dịch vụ kĩ thuật", quiTrinh: false, ngayHop: "", deadline: "2026-10-30", status: "Đã rõ yêu cầu", phuTrach: "Trâm", logYC: "", bienBan: "" },
  { id: 4, stt: 23, dauMoi: ["TCKT"], maBV: "", noiDung: "Xây dựng phân hệ quản lý bảo lãnh viện phí", ghiChu: "Chưa ký xác nhận làm rõ để lên lịch thực hiện", quiTrinh: false, ngayHop: "", deadline: "", status: "Đã rõ yêu cầu", phuTrach: "Trâm", logYC: "", bienBan: "" },
  { id: 5, stt: 26, dauMoi: ["Điều dưỡng"], maBV: "CR04", noiDung: "Xây dựng cửa sổ nhập liệu phiếu truyền máu và quản lý trạng thái chế phẩm máu (kể cả cơ chế chuyển máu khi NB chuyển khoa)", ghiChu: "Đợi ký", quiTrinh: false, ngayHop: "2026-09-07", deadline: "2026-09-30", status: "Đã rõ yêu cầu", phuTrach: "Sang", logYC: "", bienBan: "" },
  { id: 6, stt: 27, dauMoi: ["Điều dưỡng"], maBV: "CR04", noiDung: "Xây dựng cửa sổ nhập liệu phiếu truyền máu", ghiChu: "Trùng YC dòng 7", quiTrinh: false, ngayHop: "", deadline: "", status: "Done", phuTrach: "Trâm", logYC: "", bienBan: "" },
  { id: 7, stt: 43, dauMoi: ["KHTH", "CNTT"], maBV: "", noiDung: "Phân hệ phân quyền hệ thống", ghiChu: "Đã làm việc, cần họp lại. Chưa chốt các phần nội dung chính sửa trên HIS", quiTrinh: false, ngayHop: "", deadline: "", status: "Chưa làm rõ", phuTrach: "Thịnh", logYC: "", bienBan: "" },
  { id: 8, stt: 47, dauMoi: ["KHTH"], maBV: "CR37", noiDung: "Màn hình cửa sổ làm việc của bác sĩ", ghiChu: "Đã làm việc, cần KHTH ban hành quy trình", quiTrinh: false, ngayHop: "2026-09-17", deadline: "", status: "Đã rõ yêu cầu", phuTrach: "Trúc", logYC: "", bienBan: "" },
  { id: 9, stt: 66, dauMoi: ["Cấp cứu"], maBV: "CR43", noiDung: "Một số biểu mẫu chưa tích hợp: biên bản tang vật, biên bản tài sản, biên bản vô danh...", ghiChu: "", quiTrinh: false, ngayHop: "2026-08-26", deadline: "2026-10-15", status: "Đã rõ yêu cầu", phuTrach: "Trúc", logYC: "", bienBan: "" },
];

let tasks;
try { tasks = JSON.parse(localStorage.getItem(KEY)); } catch (e) { tasks = null; }
if (!Array.isArray(tasks)) tasks = sample;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} };
const readStoredArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (e) { return []; }
};
let personalTasks = readStoredArray(LIST_KEY).filter((item) => item && typeof item.title === "string");
let notes = readStoredArray(NOTES_KEY).filter((note) => note && typeof note.title === "string");
const savePersonalTasks = () => { try { localStorage.setItem(LIST_KEY, JSON.stringify(personalTasks)); } catch (e) {} };
const saveNotes = () => { try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch (e) {} };
let sttBank = [];
try {
  const storedSttBank = JSON.parse(localStorage.getItem(STT_BANK_KEY));
  if (Array.isArray(storedSttBank)) sttBank = storedSttBank.map(Number);
} catch (e) {}
const normalizeSttBank = () => {
  const used = new Set(tasks.map((task) => Number(task.stt)).filter(Number.isSafeInteger));
  sttBank = [...new Set(sttBank)].filter((stt) => Number.isSafeInteger(stt) && stt > 0 && !used.has(stt)).sort((a, b) => a - b);
};
const saveSttBank = () => { try { localStorage.setItem(STT_BANK_KEY, JSON.stringify(sttBank)); } catch (e) {} };
const renumberTasksByGroup = () => {
  const byId = new Map(tasks.map((task) => [String(task.id), task]));
  const roots = [];
  const children = new Map();
  tasks.forEach((task) => {
    const hasParentId = task.parentId !== null && task.parentId !== undefined && task.parentId !== "";
    const parent = hasParentId ? byId.get(String(task.parentId)) : null;
    if (parent && String(parent.id) !== String(task.id) && (parent.parentId === null || parent.parentId === undefined || parent.parentId === "")) {
      const key = String(parent.id);
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(task);
    } else {
      if (hasParentId) task.parentId = null;
      roots.push(task);
    }
  });
  const byOldStt = (a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0);
  roots.sort(byOldStt);
  tasks = roots.flatMap((root) => [root, ...(children.get(String(root.id)) || []).sort(byOldStt)]);
  tasks.forEach((task, index) => { task.stt = index + 1; });
  sttBank = [];
  normalizeSttBank();
};
try {
  if (localStorage.getItem(STT_RENUMBER_KEY) !== "1") {
    tasks.sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));
    tasks.forEach((task, index) => { task.stt = index + 1; });
    sttBank = [];
    localStorage.setItem(KEY, JSON.stringify(tasks));
    localStorage.setItem(STT_BANK_KEY, JSON.stringify(sttBank));
    localStorage.setItem(STT_RENUMBER_KEY, "1");
  }
} catch (e) {}
normalizeSttBank();
try {
  if (localStorage.getItem(STT_GROUP_RENUMBER_KEY) !== "1") {
    renumberTasksByGroup();
    save();
    saveSttBank();
    localStorage.setItem(STT_GROUP_RENUMBER_KEY, "1");
  }
} catch (e) {}

// ===== Danh mục (tạo thêm được trong form) =====
const CAT_KEY = "ql-cong-viec-cats-v1";
let savedCatOrder = { dauMoi: [], trangThai: [], phuTrach: [] };
try {
  const c = JSON.parse(localStorage.getItem(CAT_KEY));
  if (c) {
    DAU_MOI = c.dauMoi || DAU_MOI;
    TRANG_THAI = c.trangThai || TRANG_THAI;
    DA_XONG = c.daXong || DA_XONG;
    PHU_TRACH = c.phuTrach || [];
    savedCatOrder = {
      dauMoi: Array.isArray(c.order?.dauMoi) ? c.order.dauMoi : [],
      trangThai: Array.isArray(c.order?.trangThai) ? c.order.trangThai : [],
      phuTrach: Array.isArray(c.order?.phuTrach) ? c.order.phuTrach : [],
    };
  }
} catch (e) {}
tasks.forEach((t) => { if (t.phuTrach && !PHU_TRACH.includes(t.phuTrach)) PHU_TRACH.push(t.phuTrach); });
const CAT_ORDER = { ...savedCatOrder };
const saveCats = () => {
  try { localStorage.setItem(CAT_KEY, JSON.stringify({ dauMoi: DAU_MOI, trangThai: TRANG_THAI, daXong: DA_XONG, phuTrach: PHU_TRACH, order: CAT_ORDER })); } catch (e) {}
};
const orderedNames = (type) => {
  const names = type === "dauMoi" ? Object.keys(DAU_MOI) : type === "trangThai" ? Object.keys(TRANG_THAI) : PHU_TRACH.slice();
  const saved = (CAT_ORDER[type] || []).filter((name) => names.includes(name));
  const rest = names.filter((name) => !saved.includes(name));
  return [...saved, ...rest];
};
const orderedEntries = (type) => {
  const names = orderedNames(type);
  if (type === "phuTrach") return names.map((name) => [name, null]);
  const map = type === "dauMoi" ? DAU_MOI : TRANG_THAI;
  return names.map((name) => [name, map[name]]);
};
const setCatOrder = (type, names) => {
  CAT_ORDER[type] = Array.from(new Set(names.filter(Boolean)));
};
const syncCatOrder = () => {
  setCatOrder("dauMoi", orderedNames("dauMoi"));
  setCatOrder("trangThai", orderedNames("trangThai"));
  setCatOrder("phuTrach", orderedNames("phuTrach"));
};
syncCatOrder();
const PALETTE = ["red", "yellow", "green", "dark", "orange", "blue", "purple"];
const nextColor = (map) => { const used = Object.values(map); return PALETTE.find((c) => !used.includes(c)) || PALETTE[used.length % PALETTE.length]; };

// ===== Tiện ích =====
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (d) => (d ? d.split("-").reverse().join("/") : "");
const isoToDisplayDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
};
const displayDateToIso = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
  if (!match) return value ? null : "";
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText), month = Number(monthText), year = Number(yearText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return null;
  return `${yearText}-${monthText}-${dayText}`;
};
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const isLate = (t) => t.deadline && t.deadline < today() && !DA_XONG.includes(t.status);
const isHexColor = (color) => /^#[\da-f]{6}$/i.test(String(color || ""));
const tag = (text, color) => {
  if (!isHexColor(color)) return `<span class="tag ${color}">${esc(text)}</span>`;
  const channels = color.slice(1).match(/../g).map((value) => parseInt(value, 16));
  const brightness = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
  const foreground = brightness > 150 ? "#26221d" : "#ffffff";
  return `<span class="tag" style="background:${color};color:${foreground}">${esc(text)}</span>`;
};
const link = (u) => (/^https?:\/\//.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener">Mở link</a>` : "");

// ===== Ô chọn & danh mục =====
function fillSelect(el, first, options) {
  const cur = el.value;
  el.innerHTML = (first ? `<option value="">${first}</option>` : "") + options.map((o) => `<option>${esc(o)}</option>`).join("");
  el.value = options.includes(cur) ? cur : first ? "" : options[0] || "";
}
const people = () => [...PHU_TRACH].sort();

function renderBoxes(selected) {
  $("dauMoiBoxes").innerHTML = orderedNames("dauMoi").map((o) =>
    `<label><input type="checkbox" name="dauMoi" value="${esc(o)}" ${selected.includes(o) ? "checked" : ""}> <span>${esc(o)}</span></label>`).join("");
}

// ===== Hiển thị + lọc ngay trên tiêu đề cột =====
const one = (v) => [v || "(Trống)"];
const COLS = [
  { key: "stt", label: "STT", type: "text", get: (t) => String(t.stt) },
  { key: "dauMoi", label: "Đầu mối", type: "list", get: (t) => (t.dauMoi.length ? t.dauMoi : ["(Trống)"]) },
  { key: "maBV", label: "Mã BV", type: "list", get: (t) => one(t.maBV) },
  { key: "noiDung", label: "Nội dung theo dõi", type: "text", wide: true, get: (t) => String(t.noiDung ?? "") },
  { key: "ghiChu", label: "Ghi chú", type: "text", wide: true, get: (t) => String(t.ghiChu ?? "") },
  { key: "quiTrinh", label: "Qui trình", type: "list", get: (t) => [t.quiTrinh ? "Có" : "Chưa"] },
  { key: "ngayHop", label: "Ngày họp", type: "date", get: (t) => t.ngayHop || "" },
  { key: "deadline", label: "Deadline", type: "date", get: (t) => t.deadline || "" },
  { key: "status", label: "Trạng thái", type: "list", get: (t) => one(t.status) },
  { key: "phuTrach", label: "Phụ trách", type: "list", get: (t) => one(t.phuTrach) },
  { key: "logYC", label: "Log yêu cầu", type: "list", get: (t) => [t.logYC ? "Có link" : "Chưa có"] },
  { key: "bienBan", label: "Biên bản làm rõ", type: "list", get: (t) => [t.bienBan ? "Có link" : "Chưa có"] },
];
const filters = {}; // key -> { ex:Set } (list) | { text } (text) | { from, to } (date)
let quickFilter = "";
const collapsedGroups = new Set();
const weekRange = (offset) => {
  const [year, month, day] = today().split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const toIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { from: toIso(monday), to: toIso(sunday) };
};
const passesQuickFilter = (task) => {
  if (quickFilter === "late") return isLate(task);
  if (quickFilter !== "thisWeek" && quickFilter !== "nextWeek") return true;
  if (!task.deadline) return false;
  const range = weekRange(quickFilter === "nextWeek" ? 1 : 0);
  return task.deadline >= range.from && task.deadline <= range.to;
};
const colOptions = (c) => [...new Set(tasks.flatMap((t) => c.get(t)))].sort((a, b) =>
  c.key === "maBV"
    ? String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" })
    : String(a).localeCompare(String(b), "vi"));

function passes(t) {
  return COLS.every((c) => {
    const f = filters[c.key];
    if (!f) return true;
    const v = c.get(t);
    if (c.type === "list") {
      if (v.some((x) => !f.ex.has(x))) return true;
      if (c.key === "maBV" && t.parentId !== null && t.parentId !== undefined && t.parentId !== "") {
        const parent = tasks.find((task) => String(task.id) === String(t.parentId));
        return !!parent && c.get(parent).some((x) => !f.ex.has(x));
      }
      return false;
    }
    if (c.type === "text") return v.toLowerCase().includes(f.text);
    if (f.emptyOnly) return !v;
    return !!v && (!f.from || v >= f.from) && (!f.to || v <= f.to);
  });
}

function renderHead() {
  $("head").innerHTML = "<tr>" + COLS.map((c) => `
    <th class="${c.wide ? "wide" : ""}">
      <div class="th"><span>${c.label}</span>
        <button type="button" class="fbtn ${filters[c.key] ? "on" : ""}" data-col="${c.key}" aria-label="Lọc cột ${c.label}">▾</button>
      </div>
    </th>`).join("") + "<th>Thao tác</th></tr>";
}

function syncFrozenColumns() {
  const headers = [...$("head").querySelectorAll("th")].slice(0, 4);
  let left = 0;
  headers.forEach((header, index) => {
    const column = index + 1;
    const offset = `${left}px`;
    header.style.left = offset;
    $("rows").querySelectorAll(`td:nth-child(${column})`).forEach((cell) => { cell.style.left = offset; });
    left += header.getBoundingClientRect().width;
  });
}

function render() {
  const SVG = (inner) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const ICON_EDIT = SVG('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>');
  const ICON_DEL = SVG('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>');
  const ICON_CHILD = SVG('<path d="M4 4v16"/><path d="M4 10h8"/><path d="M12 7v12"/><path d="M16 13v5"/><path d="M13 15.5h6"/>');
  const ICON_PICK_CHILD = SVG('<path d="M9 6h11M9 12h11M9 18h6"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2"/><path d="M19 14v6m-3-3h6"/>');
  const ICON_COLLAPSE = SVG('<path d="m6 9 6 6 6-6"/>');
  const ICON_EXPAND = SVG('<path d="m9 6 6 6-6 6"/>');
  // bỏ các giá trị lọc không còn tồn tại (sau khi đổi tên/xóa danh mục)
  COLS.forEach((c) => {
    const f = filters[c.key];
    if (f && f.ex) {
      const opts = colOptions(c);
      f.ex = new Set([...f.ex].filter((x) => opts.includes(x)));
      if (!f.ex.size) delete filters[c.key];
    }
  });
  renderHead();

  const q = $("fSearch").value.trim().toLowerCase();
  const filteredTasks = tasks
    .filter((t) => passesQuickFilter(t) && (!q || [t.noiDung, t.ghiChu, t.maBV, t.phuTrach].join(" ").toLowerCase().includes(q)) && passes(t))
    .sort((a, b) => a.stt - b.stt);
  const taskById = new Map(tasks.map((task) => [String(task.id), task]));
  const visibleIds = new Set(filteredTasks.map((task) => String(task.id)));
  const visibleChildren = new Map();
  const visibleRoots = [];
  filteredTasks.forEach((task) => {
    const hasParent = task.parentId !== null && task.parentId !== undefined && task.parentId !== "";
    const parentKey = hasParent ? String(task.parentId) : "";
    if (hasParent && visibleIds.has(parentKey)) {
      if (!visibleChildren.has(parentKey)) visibleChildren.set(parentKey, []);
      visibleChildren.get(parentKey).push(task);
    } else visibleRoots.push(task);
  });
  visibleRoots.sort((a, b) => a.stt - b.stt);
  const list = visibleRoots.flatMap((root) => {
    const children = (visibleChildren.get(String(root.id)) || []).sort((a, b) => a.stt - b.stt);
    return collapsedGroups.has(String(root.id)) ? [root] : [root, ...children];
  });
  const childrenCount = new Map();
  const childOrdinals = new Map();
  tasks.forEach((task) => {
    if (task.parentId !== null && task.parentId !== undefined && task.parentId !== "") {
      const parentKey = String(task.parentId);
      const ordinal = (childrenCount.get(parentKey) || 0) + 1;
      childrenCount.set(parentKey, ordinal);
      childOrdinals.set(String(task.id), ordinal);
    }
  });

  $("rows").innerHTML = list.map((t) => {
    const parent = t.parentId === null || t.parentId === undefined ? null : taskById.get(String(t.parentId));
    const childCount = childrenCount.get(String(t.id)) || 0;
    const parentTicket = parent ? (parent.maBV ? String(parent.maBV) : `STT ${parent.stt}`) : "";
    const childTicket = parent ? `${parentTicket}.${childOrdinals.get(String(t.id)) || 1}` : "";
    const relation = parent
      ? `<span class="task-relation" title="Mã BV ticket cha · ${esc(childTicket)}">${esc(childTicket)}</span>`
      : childCount ? `<span class="task-relation">Yêu cầu chính - ${childCount}</span>` : "";
    const rowClass = [isLate(t) ? "late" : "", parent ? "child-row" : ""].filter(Boolean).join(" ");
    const groupChildrenCount = visibleChildren.get(String(t.id))?.length || 0;
    const isCollapsed = collapsedGroups.has(String(t.id));
    return `
    <tr class="${rowClass}">
      <td class="c">${esc(t.stt)}</td>
      <td>${t.dauMoi.map((d) => tag(d, DAU_MOI[d] || "grey")).join("")}</td>
      <td class="c">${esc(t.maBV)}</td>
      <td class="nd" title="${esc(t.noiDung)}"><span class="tree-cell">${parent
        ? '<span class="tree-branch" aria-hidden="true"></span>'
        : groupChildrenCount
          ? `<button type="button" class="group-toggle" data-toggle-group="${esc(t.id)}" aria-expanded="${!isCollapsed}" title="${isCollapsed ? "Mở rộng nhóm" : "Thu gọn nhóm"}" aria-label="${isCollapsed ? "Mở rộng nhóm" : "Thu gọn nhóm"}">${isCollapsed ? ICON_EXPAND : ICON_COLLAPSE}</button>`
          : '<span class="tree-spacer" aria-hidden="true"></span>'}<span class="tree-content">${relation ? `${relation} ` : ""}<span class="nd-text">${esc(t.noiDung)}</span></span></span></td>
      <td class="nd" title="${esc(t.ghiChu)}"><span class="nd-text">${esc(t.ghiChu)}</span></td>
      <td class="c"><input type="checkbox" class="qt" data-qt="${t.id}" ${t.quiTrinh ? "checked" : ""} aria-label="Qui trình"></td>
      <td class="c">${fmt(t.ngayHop)}</td>
      <td class="c">${fmt(t.deadline)}</td>
      <td>${tag(t.status, TRANG_THAI[t.status] || "grey")}</td>
      <td>${t.phuTrach ? tag(t.phuTrach, "person") : ""}</td>
      <td class="c">${link(t.logYC)}</td>
      <td class="c">${link(t.bienBan)}</td>
      <td class="row-actions">
        ${!parent ? `<button type="button" class="icon-btn" data-add-child="${esc(t.id)}" title="Thêm nội dung con" aria-label="Thêm nội dung con">${ICON_CHILD}</button>` : ""}
        ${!parent ? `<button type="button" class="icon-btn" data-pick-children="${esc(t.id)}" title="Gán nội dung có sẵn" aria-label="Gán nội dung có sẵn">${ICON_PICK_CHILD}</button>` : ""}
        <button type="button" class="icon-btn" data-edit="${t.id}" title="Sửa" aria-label="Sửa">${ICON_EDIT}</button>
        <button type="button" class="icon-btn danger" data-del="${t.id}" title="Xóa" aria-label="Xóa">${ICON_DEL}</button>
      </td>
    </tr>`;
  }).join("");
  syncFrozenColumns();

  $("empty").hidden = list.length > 0;
  const late = tasks.filter(isLate).length;
  $("count").innerHTML = `<strong class="count-total">${tasks.length}</strong><span class="count-label">công việc</span><span class="count-meta">${list.length} đang hiển thị · ${late} việc trễ</span>`;
  renderHome();
  document.querySelectorAll("[data-quick-filter]").forEach((button) => {
    const active = button.dataset.quickFilter === quickFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderHome() {
  const totalLate = tasks.filter(isLate).length;
  $("homeSnapshot").textContent = `${tasks.length} nhiệm vụ · ${totalLate} cần chú ý`;
  $("portalBoardCount").textContent = `${tasks.length} CÔNG VIỆC`;
  $("portalListCount").textContent = `${personalTasks.filter((task) => !task.done).length} ĐANG MỞ`;
  $("portalNotesCount").textContent = `${notes.length} GHI CHÚ`;
}

function showAppView(view) {
  $("homeScreen").hidden = true;
  $("workspaceScreen").hidden = view !== "board";
  $("listScreen").hidden = view !== "list";
  $("notesScreen").hidden = view !== "notes";
  document.body.classList.toggle("showing-app-screen", view !== "board");
  if (view === "list") renderPersonalTasks();
  if (view === "notes") renderNotes();
}
function showHome() {
  $("homeScreen").hidden = false;
  $("workspaceScreen").hidden = true;
  $("listScreen").hidden = true;
  $("notesScreen").hidden = true;
  document.body.classList.remove("showing-app-screen");
  renderHome();
}
document.querySelectorAll("[data-open-view]").forEach((button) => {
  button.addEventListener("click", () => showAppView(button.dataset.openView));
});
document.querySelectorAll("[data-back-home]").forEach((button) => button.addEventListener("click", showHome));
$ ("btnHomeReturn").addEventListener("click", showHome);

const makeLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const formatLocalDate = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN").format(new Date(year, month - 1, day));
};
const listIsLate = (item) => !item.done && item.deadline && item.deadline < today();
let listEditingId = null;
let noteEditingId = null;
let noteFilterMode = "all";
let noteViewMode = "grid";
let noteDraftImages = [];

function renderPersonalTasks() {
  const query = $("listSearch").value.trim().toLocaleLowerCase("vi");
  const filter = $("listFilter").value;
  const sort = $("listSort").value;
  const visible = personalTasks.filter((item) => {
    const textMatches = !query || item.title.toLocaleLowerCase("vi").includes(query);
    const filterMatches = filter === "all" || (filter === "open" && !item.done) || (filter === "done" && item.done) || (filter === "late" && listIsLate(item));
    return textMatches && filterMatches;
  }).sort((a, b) => {
    if (sort === "created") return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    if (sort === "title") return a.title.localeCompare(b.title, "vi");
    return (a.deadline || "9999-12-31").localeCompare(b.deadline || "9999-12-31") || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
  const taskRows = visible.map((item) => {
    const images = Array.isArray(item.images) ? item.images : [];
    const hasNote = Boolean(item.noteText || item.note || images.length);
    return `<tr class="${item.done ? "list-row-done" : ""} ${listIsLate(item) ? "list-row-late" : ""}">
      <td class="list-title-cell"><button type="button" class="list-title-button" data-edit-list="${esc(item.id)}"><span class="list-file-icon" aria-hidden="true">▯</span><span class="list-title-text">${esc(item.title)}</span>${hasNote ? `<span class="list-note-mark" title="Có ghi chú">✎</span>` : ""}${images.length ? `<span class="list-image-count" title="${images.length} ảnh">▧ ${images.length}</span>` : ""}</button><button type="button" class="list-row-delete" data-delete-list="${esc(item.id)}" aria-label="Xóa ${esc(item.title)}" title="Xóa công việc">×</button></td>
      <td class="${listIsLate(item) ? "personal-date-late" : ""}">${formatLocalDate(item.deadline)}</td>
      <td class="list-done-cell"><input type="checkbox" data-toggle-list="${esc(item.id)}" ${item.done ? "checked" : ""} aria-label="Đánh dấu ${esc(item.title)} hoàn tất"></td>
      <td>${formatLocalDate(item.createdAt)}</td>
    </tr>`;
  }).join("");
  const createRow = `<tr class="list-create-row"><td><form id="inlineTaskForm"><span aria-hidden="true">＋</span><input id="inlineTaskTitle" type="text" maxlength="180" placeholder="Nhập tiêu đề công việc mới..." aria-label="Tiêu đề công việc mới" required><button type="submit" aria-label="Tạo công việc" title="Tạo công việc">↵</button></form></td><td></td><td class="list-done-cell"><input type="checkbox" disabled aria-label="Công việc mới chưa hoàn tất"></td><td>${formatLocalDate(today())}</td></tr>`;
  $("listRows").innerHTML = taskRows + createRow;
  const openCount = personalTasks.filter((item) => !item.done).length;
  $("listCountLabel").textContent = `${visible.length}`;
  $("listFooterCount").textContent = `${openCount} việc chưa hoàn thành · ${personalTasks.length} tổng cộng`;
  $("listEmpty").hidden = visible.length > 0 || personalTasks.length === 0;
  renderHome();
}

function renderNotes() {
  const query = $("noteSearch").value.trim().toLocaleLowerCase("vi");
  const selectedTag = $("noteTagFilter").value;
  const allTags = [...new Set(notes.map((note) => note.tag).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const tagFilter = $("noteTagFilter");
  const previousTag = selectedTag;
  tagFilter.innerHTML = '<option value="all">Tất cả chủ đề</option>' + allTags.map((tag) => `<option value="${esc(tag)}">${esc(tag)}</option>`).join("");
  tagFilter.value = allTags.includes(previousTag) ? previousTag : "all";
  $("notesGrid").classList.toggle("notes-grid-horizontal", noteViewMode === "horizontal");
  $("notesGrid").classList.toggle("notes-grid-vertical", noteViewMode === "vertical");
  document.querySelectorAll("[data-note-view]").forEach((button) => {
    const active = button.dataset.noteView === noteViewMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const visible = notes.filter((note) => {
    const matchesSearch = !query || `${note.title} ${note.content} ${note.tag || ""}`.toLocaleLowerCase("vi").includes(query);
    return matchesSearch && (noteFilterMode !== "pinned" || note.pinned) && (tagFilter.value === "all" || note.tag === tagFilter.value);
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  $("notesGrid").innerHTML = visible.map((note) => {
    const images = Array.isArray(note.images) ? note.images : [];
    const imagePreviews = images.slice(0, 4).map((image) => `<img src="${esc(image.src)}" alt="${esc(image.name || "Ảnh ghi chú")}">`).join("");
    return `
    <article class="note-card note-${["sage", "peach", "blue", "lilac", "yellow"].includes(note.color) ? note.color : "sage"}">
      <button type="button" class="note-open" data-edit-note="${esc(note.id)}"><span class="note-card-top"><span>${note.tag ? esc(note.tag) : "GHI CHÚ"}${images.length ? ` · ▧ ${images.length}` : ""}</span><span>${formatLocalDate(note.updatedAt)}</span></span><strong>${esc(note.title)}</strong><span class="note-excerpt">${esc(note.content || "Chưa có nội dung")}</span>${imagePreviews ? `<span class="note-card-image-strip">${imagePreviews}</span>` : ""}</button>
      <div class="note-card-actions"><button type="button" class="note-pin ${note.pinned ? "is-pinned" : ""}" data-toggle-pin="${esc(note.id)}" aria-label="${note.pinned ? "Bỏ ghim" : "Ghim ghi chú"}" title="${note.pinned ? "Bỏ ghim" : "Ghim ghi chú"}">${note.pinned ? "★" : "☆"}</button><button type="button" data-delete-note="${esc(note.id)}" aria-label="Xóa ghi chú" title="Xóa ghi chú">×</button></div>
    </article>`;
  }).join("");
  $("noteTotal").textContent = String(notes.length).padStart(2, "0");
  $("notesFooterMeta").textContent = `${notes.filter((note) => note.pinned).length} ĐÃ GHIM · ${notes.length} TỔNG CỘNG`;
  $("notesEmpty").hidden = visible.length > 0;
  renderHome();
}

const taskNoteDialog = $("taskNoteDlg");
const taskNoteForm = $("taskNoteForm");
const noteDialog = $("noteDlg");
const noteForm = $("noteForm");
let taskNoteEditingId = null;
const renderTaskImages = () => {
  const item = personalTasks.find((task) => String(task.id) === String(taskNoteEditingId));
  const images = Array.isArray(item?.images) ? item.images : [];
  $("taskImageGrid").innerHTML = images.map((image) => `<figure class="task-image-preview"><img src="${esc(image.src)}" alt="${esc(image.name || "Ảnh đính kèm")}"><button type="button" data-remove-task-image="${esc(image.id)}" aria-label="Xóa ảnh ${esc(image.name || "đính kèm")}" title="Xóa ảnh">×</button></figure>`).join("");
};
const openTaskNote = (id) => {
  const item = personalTasks.find((task) => String(task.id) === String(id));
  if (!item) return;
  taskNoteEditingId = item.id;
  $("taskNoteTitle").value = item.title;
  $("taskNoteDeadline").value = item.deadline || "";
  $("taskNoteText").value = item.noteText || item.note || "";
  $("taskNoteDlgTitle").textContent = "Ghi chú công việc";
  $("taskImageStatus").textContent = "";
  renderTaskImages();
  taskNoteDialog.showModal();
};
$("listRows").addEventListener("submit", (event) => {
  if (event.target.id !== "inlineTaskForm") return;
  event.preventDefault();
  const title = $("inlineTaskTitle").value.trim();
  if (!title) return;
  const item = { id: makeLocalId(), title, deadline: "", done: false, createdAt: today(), noteText: "", images: [] };
  personalTasks.push(item);
  savePersonalTasks();
  renderPersonalTasks();
  openTaskNote(item.id);
});
taskNoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = personalTasks.find((task) => String(task.id) === String(taskNoteEditingId));
  if (!item) return;
  item.title = $("taskNoteTitle").value.trim();
  item.deadline = $("taskNoteDeadline").value;
  item.noteText = $("taskNoteText").value.trim();
  item.images = Array.isArray(item.images) ? item.images : [];
  savePersonalTasks();
  taskNoteDialog.close();
  renderPersonalTasks();
  $("inlineTaskTitle").focus();
});
const readTaskImage = async (file) => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(error);
      reader.readAsDataURL(file);
    });
  }
};
$("taskNoteImages").addEventListener("change", async (event) => {
  const item = personalTasks.find((task) => String(task.id) === String(taskNoteEditingId));
  if (!item) return;
  item.images = Array.isArray(item.images) ? item.images : [];
  const files = [...event.target.files].filter((file) => file.type.startsWith("image/"));
  const available = Math.max(0, 8 - item.images.length);
  const selected = files.slice(0, available);
  if (files.length > available) $("taskImageStatus").textContent = "Mỗi công việc có thể lưu tối đa 8 ảnh.";
  else $("taskImageStatus").textContent = selected.length ? "Đang thêm ảnh..." : "";
  for (const file of selected) {
    try { item.images.push({ id: makeLocalId(), name: file.name, src: await readTaskImage(file) }); }
    catch (error) { $("taskImageStatus").textContent = `Không thể thêm ảnh ${file.name}.`; }
  }
  savePersonalTasks();
  renderTaskImages();
  if (selected.length && item.images.length <= 8) $("taskImageStatus").textContent = `${selected.length} ảnh đã được thêm.`;
  event.target.value = "";
});
$("taskImageGrid").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-task-image]");
  if (!remove) return;
  const item = personalTasks.find((task) => String(task.id) === String(taskNoteEditingId));
  if (!item) return;
  item.images = (Array.isArray(item.images) ? item.images : []).filter((image) => String(image.id) !== remove.dataset.removeTaskImage);
  savePersonalTasks();
  renderTaskImages();
  $("taskImageStatus").textContent = "Đã xóa ảnh.";
});
$("listRows").addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-toggle-list]");
  if (!checkbox) return;
  const item = personalTasks.find((task) => String(task.id) === checkbox.dataset.toggleList);
  if (!item) return;
  item.done = checkbox.checked;
  savePersonalTasks();
  renderPersonalTasks();
});
$("listRows").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-list]");
  if (edit) return openTaskNote(edit.dataset.editList);
  const remove = event.target.closest("[data-delete-list]");
  if (!remove) return;
  personalTasks = personalTasks.filter((item) => String(item.id) !== remove.dataset.deleteList);
  savePersonalTasks();
  renderPersonalTasks();
});
$("listSearch").addEventListener("input", renderPersonalTasks);
$("listFilter").addEventListener("change", renderPersonalTasks);
$("listSort").addEventListener("change", renderPersonalTasks);

const openNote = (id = null) => {
  noteEditingId = id;
  const note = notes.find((item) => String(item.id) === String(id));
  noteDraftImages = Array.isArray(note?.images) ? note.images.slice() : [];
  noteForm.reset();
  $("noteTitle").value = note?.title || "";
  $("noteTag").value = note?.tag || "";
  $("noteContent").value = note?.content || "";
  $("noteColor").value = note?.color || "sage";
  $("notePinned").checked = Boolean(note?.pinned);
  $("noteDlgTitle").textContent = note ? "Chỉnh sửa ghi chú" : "Ghi chú mới";
  $("noteImageStatus").textContent = "";
  renderNoteImages();
  noteDialog.showModal();
  $("noteTitle").focus();
};
function renderNoteImages() {
  $("noteImageGrid").innerHTML = noteDraftImages.map((image) => `<figure class="note-image-preview"><img src="${esc(image.src)}" alt="${esc(image.name || "Ảnh ghi chú")}"><button type="button" data-remove-note-image="${esc(image.id)}" aria-label="Xóa ảnh ${esc(image.name || "đính kèm")}" title="Xóa ảnh">×</button></figure>`).join("");
}
async function addNoteImages(files) {
  const selected = files.filter((file) => file.type.startsWith("image/"));
  const available = Math.max(0, 6 - noteDraftImages.length);
  const accepted = selected.slice(0, available);
  $("noteImageStatus").textContent = selected.length > available ? "Mỗi ghi chú có thể lưu tối đa 6 ảnh." : accepted.length ? "Đang thêm ảnh..." : "";
  for (const file of accepted) {
    try { noteDraftImages.push({ id: makeLocalId(), name: file.name || "Ảnh dán", src: await readTaskImage(file) }); }
    catch (error) { $("noteImageStatus").textContent = "Không thể thêm ảnh này."; }
  }
  renderNoteImages();
  if (accepted.length) $("noteImageStatus").textContent = `${noteDraftImages.length} ảnh đã đính kèm.`;
}
$("btnNewNote").addEventListener("click", () => openNote());
$("btnNotesEmptyAdd").addEventListener("click", () => openNote());
$("noteImages").addEventListener("change", async (event) => {
  await addNoteImages([...event.target.files]);
  event.target.value = "";
});
$("noteContent").addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  event.preventDefault();
  addNoteImages(files);
});
$("noteImageGrid").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-note-image]");
  if (!remove) return;
  noteDraftImages = noteDraftImages.filter((image) => String(image.id) !== remove.dataset.removeNoteImage);
  renderNoteImages();
  $("noteImageStatus").textContent = "Đã xóa ảnh.";
});
noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("noteTitle").value.trim();
  if (!title) return;
  const current = notes.find((item) => String(item.id) === String(noteEditingId));
  const values = { title, tag: $("noteTag").value.trim(), content: $("noteContent").value.trim(), images: noteDraftImages.slice(), color: $("noteColor").value, pinned: $("notePinned").checked, updatedAt: today() };
  if (current) Object.assign(current, values);
  else notes.push({ id: makeLocalId(), ...values });
  saveNotes();
  noteDialog.close();
  renderNotes();
});
$("notesGrid").addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-note]");
  if (edit) return openNote(edit.dataset.editNote);
  const pin = event.target.closest("[data-toggle-pin]");
  if (pin) {
    const note = notes.find((item) => String(item.id) === pin.dataset.togglePin);
    if (note) note.pinned = !note.pinned;
    saveNotes();
    return renderNotes();
  }
  const remove = event.target.closest("[data-delete-note]");
  if (!remove) return;
  notes = notes.filter((note) => String(note.id) !== remove.dataset.deleteNote);
  saveNotes();
  renderNotes();
});
$("noteSearch").addEventListener("input", renderNotes);
$("noteTagFilter").addEventListener("change", renderNotes);
document.querySelector(".notes-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-note-filter]");
  if (!tab) return;
  noteFilterMode = tab.dataset.noteFilter;
  document.querySelectorAll("[data-note-filter]").forEach((button) => {
    const active = button === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderNotes();
});
document.querySelector(".notes-view-switch").addEventListener("click", (event) => {
  const button = event.target.closest("[data-note-view]");
  if (!button) return;
  noteViewMode = button.dataset.noteView;
  renderNotes();
});

renderHome();

// ----- Hộp lọc hiện ra khi bấm ▾ trên tiêu đề cột -----
const pop = document.createElement("div");
pop.id = "pop";
pop.hidden = true;
document.body.appendChild(pop);
let popCol = null;
const closePop = () => { pop.hidden = true; popCol = null; };
const colOf = (key) => COLS.find((c) => c.key === key);

function setFilter(key, f) {
  if (f) filters[key] = f; else delete filters[key];
  render();
}

function openPop(btn, key) {
  if (!pop.hidden && popCol === key) return closePop();
  const c = colOf(key), f = filters[key];
  popCol = key;
  let body;
  if (c.type === "list") {
    const opts = colOptions(c);
    body = `<div class="pop-links"><button type="button" data-p="all">Chọn tất cả</button><button type="button" data-p="none">Bỏ chọn</button></div>
      <div class="pop-list">${opts.map((o) =>
        `<label><input type="checkbox" value="${esc(o)}" ${f && f.ex.has(o) ? "" : "checked"}> ${esc(o)}</label>`).join("") || '<p class="hint">Chưa có dữ liệu.</p>'}</div>`;
  } else if (c.type === "text") {
    body = `<input type="search" data-p="text" placeholder="Chứa chữ..." value="${esc(f ? f.text : "")}">`;
  } else {
    body = `<label class="pop-empty"><input type="checkbox" data-p="emptyOnly" ${f && f.emptyOnly ? "checked" : ""}> Chỉ ô trống</label>
            <label>Từ ngày <input type="date" data-p="from" value="${f ? f.from : ""}" ${f && f.emptyOnly ? "disabled" : ""}></label>
            <label>Đến ngày <input type="date" data-p="to" value="${f ? f.to : ""}" ${f && f.emptyOnly ? "disabled" : ""}></label>`;
  }
  pop.innerHTML = `<strong>${esc(c.label)}</strong>${body}<button type="button" data-p="reset">Xóa lọc cột này</button>`;
  pop.hidden = false;
  const r = btn.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + "px";
  pop.style.top = r.bottom + 4 + "px";
  const first = pop.querySelector("input[type=search], input[type=date]");
  if (first) first.focus();
}

function applyFromPop() {
  const c = colOf(popCol);
  if (!c) return;
  if (c.type === "list") {
    const ex = new Set([...pop.querySelectorAll(".pop-list input")].filter((b) => !b.checked).map((b) => b.value));
    setFilter(c.key, ex.size ? { ex } : null);
  } else if (c.type === "text") {
    const text = pop.querySelector('[data-p="text"]').value.trim().toLowerCase();
    setFilter(c.key, text ? { text } : null);
  } else {
    const emptyOnly = pop.querySelector('[data-p="emptyOnly"]').checked;
    const from = pop.querySelector('[data-p="from"]'), to = pop.querySelector('[data-p="to"]');
    from.disabled = emptyOnly;
    to.disabled = emptyOnly;
    setFilter(c.key, emptyOnly || from.value || to.value ? { emptyOnly, from: from.value, to: to.value } : null);
  }
}

pop.addEventListener("input", applyFromPop);
pop.addEventListener("change", (e) => { if (e.target.matches('[data-p="emptyOnly"]')) applyFromPop(); });
pop.addEventListener("click", (e) => {
  const p = e.target.dataset.p;
  if (p === "all" || p === "none") {
    pop.querySelectorAll(".pop-list input").forEach((b) => { b.checked = p === "all"; });
    applyFromPop();
  } else if (p === "reset") {
    const key = popCol;
    closePop();
    setFilter(key, null);
  }
});

$("head").addEventListener("click", (e) => {
  const b = e.target.closest(".fbtn");
  if (!b) return;
  e.stopPropagation();
  openPop(b, b.dataset.col);
});
document.addEventListener("click", (e) => { if (!pop.hidden && !pop.contains(e.target)) closePop(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });
window.addEventListener("scroll", (e) => { if (!pop.hidden && !pop.contains(e.target)) closePop(); }, true);

$("fSearch").addEventListener("input", render);
document.querySelector(".quick-filters").addEventListener("click", (e) => {
  const button = e.target.closest("[data-quick-filter]");
  if (!button) return;
  quickFilter = quickFilter === button.dataset.quickFilter ? "" : button.dataset.quickFilter;
  render();
});
$("btnClear").onclick = () => {
  $("fSearch").value = "";
  quickFilter = "";
  Object.keys(filters).forEach((k) => delete filters[k]);
  closePop();
  render();
};

// ===== Thêm / sửa / xóa =====
const dlg = $("dlg"), form = $("form");
let editingId = null;
const nextStt = () => {
  normalizeSttBank();
  return sttBank[0] ?? tasks.reduce((max, task) => Math.max(max, Number(task.stt) || 0), 0) + 1;
};
[form.ngayHop, form.deadline].forEach((field) => {
  const picker = form.querySelector(`[data-date-picker="${field.name}"]`);
  field.addEventListener("input", () => {
    field.setCustomValidity("");
    const isoDate = displayDateToIso(field.value);
    if (isoDate !== null) picker.value = isoDate;
  });
});
form.addEventListener("click", (e) => {
  const button = e.target.closest("[data-open-picker]");
  if (!button) return;
  const picker = form.querySelector(`[data-date-picker="${button.dataset.openPicker}"]`);
  if (!picker) return;
  if (picker.showPicker) picker.showPicker();
  else { picker.focus({ preventScroll: true }); picker.click(); }
});
form.addEventListener("change", (e) => {
  const name = e.target.dataset.datePicker;
  if (!name) return;
  const field = form.elements.namedItem(name);
  field.value = isoToDisplayDate(e.target.value);
  field.setCustomValidity("");
});

function openForm(t, requestedParentId = null) {
  editingId = t ? t.id : null;
  $("dlgTitle").textContent = t ? "Sửa công việc" : "Thêm công việc";
  form.reset();
  form.stt.readOnly = !t;
  const d = t || { stt: nextStt(), dauMoi: [], status: Object.keys(TRANG_THAI)[0], phuTrach: "", parentId: requestedParentId };
  renderBoxes(d.dauMoi);
  fillSelect(form.status, "", orderedNames("trangThai"));
  fillSelect(form.phuTrach, "Chưa chọn", people());
  const hasChildren = !!t && tasks.some((task) => String(task.parentId) === String(t.id));
  const parentOptions = tasks.filter((task) => !task.parentId && (!t || String(task.id) !== String(t.id)));
  form.parentId.innerHTML = '<option value="">Nội dung độc lập</option>' + parentOptions.map((parent) =>
    `<option value="${esc(parent.id)}">STT ${esc(parent.stt)} · ${esc(String(parent.noiDung).slice(0, 55))}</option>`).join("");
  form.parentId.value = d.parentId == null ? "" : String(d.parentId);
  form.parentId.disabled = hasChildren;
  ["stt", "maBV", "noiDung", "ghiChu", "ngayHop", "deadline", "status", "phuTrach", "logYC", "bienBan"]
    .forEach((k) => { form[k].value = k === "ngayHop" || k === "deadline" ? isoToDisplayDate(d[k]) : d[k] ?? ""; });
  form.querySelector('[data-date-picker="ngayHop"]').value = d.ngayHop || "";
  form.querySelector('[data-date-picker="deadline"]').value = d.deadline || "";
  form.ngayHop.setCustomValidity("");
  form.deadline.setCustomValidity("");
  form.quiTrinh.checked = !!d.quiTrinh;
  form.querySelector(".grid").scrollTop = 0;
  dlg.showModal();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ngayHop = displayDateToIso(form.ngayHop.value);
  const deadline = displayDateToIso(form.deadline.value);
  if (ngayHop === null || deadline === null) {
    const field = ngayHop === null ? form.ngayHop : form.deadline;
    field.setCustomValidity("Nhập ngày hợp lệ theo định dạng dd/mm/yyyy.");
    field.reportValidity();
    return;
  }
  const t = {
    id: editingId ?? Date.now(),
    stt: Number(form.stt.value) || 0,
    dauMoi: [...form.querySelectorAll('[name="dauMoi"]:checked')].map((c) => c.value),
    maBV: form.maBV.value.trim(), noiDung: form.noiDung.value.trim(), ghiChu: form.ghiChu.value.trim(),
    quiTrinh: form.quiTrinh.checked, ngayHop, deadline,
    parentId: form.parentId.value ? tasks.find((task) => String(task.id) === form.parentId.value)?.id ?? null : null,
    status: form.status.value, phuTrach: form.phuTrach.value.trim(),
    logYC: form.logYC.value.trim(), bienBan: form.bienBan.value.trim(),
  };
  const i = tasks.findIndex((x) => x.id === t.id);
  if (i >= 0) {
    const previousStt = Number(tasks[i].stt);
    tasks[i] = t;
    if (previousStt !== t.stt && Number.isSafeInteger(previousStt) && previousStt > 0) sttBank.push(previousStt);
  } else tasks.push(t);
  renumberTasksByGroup();
  save(); saveSttBank(); dlg.close(); render();
});

$("btnAdd").onclick = () => openForm(null);

$("rows").addEventListener("click", (e) => {
  const groupButton = e.target.closest("[data-toggle-group]");
  if (groupButton) {
    const groupId = groupButton.dataset.toggleGroup;
    if (collapsedGroups.has(groupId)) collapsedGroups.delete(groupId); else collapsedGroups.add(groupId);
    render();
    return;
  }
  const pickButton = e.target.closest("[data-pick-children]");
  if (pickButton) {
    openChildPicker(pickButton.dataset.pickChildren);
    return;
  }
  const childButton = e.target.closest("[data-add-child]");
  if (childButton) {
    const parent = tasks.find((task) => String(task.id) === childButton.dataset.addChild);
    if (parent) openForm(null, parent.id);
    return;
  }
  const edit = e.target.dataset.edit, del = e.target.dataset.del;
  if (edit) openForm(tasks.find((t) => t.id == edit));
  const taskToDelete = del ? tasks.find((t) => t.id == del) : null;
  const childCount = taskToDelete ? tasks.filter((task) => String(task.parentId) === String(taskToDelete.id)).length : 0;
  const message = childCount
    ? `Xóa nội dung cha này? ${childCount} nội dung con sẽ được chuyển thành độc lập.`
    : "Xóa công việc này?";
  if (del && confirm(message)) {
    const removed = tasks.find((t) => t.id == del);
    tasks.forEach((task) => { if (String(task.parentId) === String(removed.id)) task.parentId = null; });
    tasks = tasks.filter((t) => t.id != del);
    const removedStt = Number(removed?.stt);
    if (Number.isSafeInteger(removedStt) && removedStt > 0) sttBank.push(removedStt);
    collapsedGroups.delete(String(removed.id));
    renumberTasksByGroup();
    save(); saveSttBank(); render();
  }
});

const childPickDlg = $("childPickDlg");
let childPickParentId = null;

function updateChildPickSummary() {
  const selected = childPickDlg.querySelectorAll("[data-child-id]:checked").length;
  $("childPickSummary").textContent = `${selected} nội dung được chọn`;
}

function openChildPicker(parentId) {
  const parent = tasks.find((task) => String(task.id) === String(parentId));
  if (!parent) return;
  childPickParentId = String(parent.id);
  $("childPickParent").textContent = `Cha · STT ${parent.stt} · ${parent.noiDung}`;
  const currentChildren = new Set(tasks
    .filter((task) => String(task.parentId) === childPickParentId)
    .map((task) => String(task.id)));
  const candidates = tasks.filter((task) => {
    if (String(task.id) === childPickParentId) return false;
    const isCurrentChild = currentChildren.has(String(task.id));
    const hasAnotherParent = task.parentId !== null && task.parentId !== undefined && task.parentId !== "" && !isCurrentChild;
    if (hasAnotherParent) return false;
    return !tasks.some((child) => String(child.parentId) === String(task.id));
  }).sort((a, b) => a.stt - b.stt);
  $("childPickList").innerHTML = candidates.length ? candidates.map((task) => `
    <label class="child-pick-row" title="${esc(task.noiDung)}">
      <input type="checkbox" data-child-id="${esc(task.id)}" ${currentChildren.has(String(task.id)) ? "checked" : ""}>
      <span><strong>STT ${esc(task.stt)}${task.maBV ? ` · ${esc(task.maBV)}` : ""}</strong><small>${esc(task.noiDung)}</small></span>
    </label>`).join("") : '<p class="child-pick-empty">Không còn nội dung độc lập để gán.</p>';
  $("childPickSearch").value = "";
  updateChildPickSummary();
  if (!childPickDlg.open) childPickDlg.showModal();
}

$("childPickList").addEventListener("change", updateChildPickSummary);
$("childPickSearch").addEventListener("input", (e) => {
  const query = e.target.value.trim().toLocaleLowerCase("vi");
  childPickDlg.querySelectorAll(".child-pick-row").forEach((row) => {
    row.hidden = !row.textContent.toLocaleLowerCase("vi").includes(query);
  });
});
$("btnChildPickCancel").onclick = () => childPickDlg.close();
$("btnChildPickSave").onclick = () => {
  const parent = tasks.find((task) => String(task.id) === childPickParentId);
  if (!parent) return childPickDlg.close();
  const selected = new Set([...childPickDlg.querySelectorAll("[data-child-id]:checked")].map((input) => input.dataset.childId));
  tasks.forEach((task) => {
    if (String(task.parentId) === childPickParentId) task.parentId = null;
    if (selected.has(String(task.id))) task.parentId = parent.id;
  });
  renumberTasksByGroup();
  save();
  childPickDlg.close();
  render();
};

// ===== Quản lý danh mục: thêm / sửa / xóa =====
const mgr = $("mgr");
let activeMgrTab = "dauMoi";
const MGR_TABS = [
  { key: "dauMoi", label: "Đầu Mối" },
  { key: "trangThai", label: "Trạng Thái" },
  { key: "phuTrach", label: "Người Phụ Trách" },
];
const COLOR_PICKER_VALUES = {
  red: "#fde0e0", yellow: "#fff2b8", green: "#d8f0d4", dark: "#3a2a20",
  orange: "#ffe0c2", blue: "#d4e8fb", purple: "#e8d9f7",
};
const catMap = (type) => (type === "dauMoi" ? DAU_MOI : TRANG_THAI);
const countUse = (type, name) => tasks.filter((t) =>
  type === "dauMoi" ? t.dauMoi.includes(name) : type === "trangThai" ? t.status === name : t.phuTrach === name).length;

function renderMgr() {
  const tabs = document.querySelectorAll(".mgr-tab");
  tabs.forEach((button) => {
    const isActive = button.dataset.mgrTab === activeMgrTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  const attrs = (type, name, act) => `data-act="${act}" data-type="${type}" data-name="${esc(name)}"`;
  const row = (type, name, color, index) => {
    const swatchClass = isHexColor(color) ? "" : ` ${color}`;
    const swatchStyle = isHexColor(color) ? ` style="background:${color}"` : "";
    const pickerValue = isHexColor(color) ? color : COLOR_PICKER_VALUES[color] || "#d4e8fb";
    const colorControl = type === "phuTrach"
      ? '<span class="color-slot" aria-hidden="true"></span>'
      : `<input type="color" ${attrs(type, name, "color")} value="${pickerValue}" title="Chọn màu">`;
    return `
      <div class="mrow" data-type="${type}" data-name="${esc(name)}" draggable="true">
        <span class="stt-cell">${index + 1}</span>
        <input ${attrs(type, name, "rename")} value="${esc(name)}">
        ${colorControl}
        ${type === "trangThai" ? `<label class="check"><input type="checkbox" ${attrs(type, name, "done")} ${DA_XONG.includes(name) ? "checked" : ""}> Hoàn thành</label>` : '<span class="spacer"></span>'}
        <button type="button" class="cat-del" ${attrs(type, name, "del")} title="Xóa danh mục" aria-label="Xóa danh mục">×</button>
      </div>`;
  };

  const currentTab = MGR_TABS.find((tab) => tab.key === activeMgrTab) || MGR_TABS[0];
  const currentItems = currentTab.key === "dauMoi"
    ? orderedEntries("dauMoi")
    : currentTab.key === "trangThai"
      ? orderedEntries("trangThai")
      : orderedEntries("phuTrach");

  $("mgrBody").innerHTML = `
    <section class="mgr-section">
      <h3>${currentTab.label}</h3>
      <div class="addrow addrow-top ${currentTab.key === "phuTrach" ? "addrow-no-color" : ""}">
        <input data-new="${currentTab.key}" placeholder="Thêm ${currentTab.label.toLowerCase()} mới">
        ${currentTab.key === "phuTrach" ? "" : '<input type="color" data-new-color value="#d4e8fb" aria-label="Chọn màu cho danh mục mới" title="Chọn màu">'}
        <button type="button" data-act="add" data-type="${currentTab.key}">Thêm</button>
      </div>
      <div class="mgr-list">
        ${currentItems.map(([n, c], idx) => row(currentTab.key, n, c, idx)).join("") || '<p class="hint">Chưa có mục nào.</p>'}
      </div>
    </section>`;
}

document.querySelectorAll(".mgr-tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeMgrTab = button.dataset.mgrTab;
    renderMgr();
  });
});

function reorderCat(type, fromName, toName) {
  const names = orderedNames(type);
  const fromIndex = names.indexOf(fromName);
  const toIndex = names.indexOf(toName);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
  names.splice(fromIndex, 1);
  names.splice(toIndex, 0, fromName);
  setCatOrder(type, names);
  if (type === "phuTrach") {
    PHU_TRACH = names.slice();
  } else {
    const next = {};
    names.forEach((name) => {
      const source = type === "dauMoi" ? DAU_MOI : TRANG_THAI;
      if (source[name] !== undefined) next[name] = source[name];
    });
    if (type === "dauMoi") DAU_MOI = next; else TRANG_THAI = next;
  }
}

function addCat(type, name, color) {
  name = name.trim();
  if (!name) return;
  if (type === "phuTrach") {
    if (!PHU_TRACH.includes(name)) {
      PHU_TRACH.push(name);
      setCatOrder("phuTrach", PHU_TRACH.slice());
    }
  } else if (!(name in catMap(type))) {
    catMap(type)[name] = isHexColor(color) ? color : nextColor(catMap(type));
    const keys = orderedNames(type);
    keys.push(name);
    setCatOrder(type, keys);
  }
}

function renameCat(type, old, nw) {
  nw = nw.trim();
  if (nw === old) return;
  const exists = type === "phuTrach" ? PHU_TRACH.includes(nw) : nw in catMap(type);
  if (!nw || exists) { alert(!nw ? "Tên không được để trống." : `"${nw}" đã tồn tại.`); return; }
  if (type === "phuTrach") {
    PHU_TRACH = PHU_TRACH.map((p) => (p === old ? nw : p));
    setCatOrder("phuTrach", PHU_TRACH.slice());
    tasks.forEach((t) => { if (t.phuTrach === old) t.phuTrach = nw; });
    return;
  }
  const order = orderedNames(type).map((name) => (name === old ? nw : name));
  const renamed = Object.fromEntries(Object.entries(catMap(type)).map(([k, v]) => [k === old ? nw : k, v]));
  if (type === "dauMoi") {
    DAU_MOI = renamed;
    setCatOrder("dauMoi", order);
    tasks.forEach((t) => { t.dauMoi = t.dauMoi.map((d) => (d === old ? nw : d)); });
  } else {
    TRANG_THAI = renamed;
    setCatOrder("trangThai", order);
    DA_XONG = DA_XONG.map((s) => (s === old ? nw : s));
    tasks.forEach((t) => { if (t.status === old) t.status = nw; });
  }
}

function deleteCat(type, name) {
  const n = countUse(type, name);
  if (type === "trangThai" && Object.keys(TRANG_THAI).length === 1) { alert("Phải còn ít nhất một trạng thái."); return; }
  if (type === "trangThai" && n) { alert(`Có ${n} công việc đang dùng trạng thái "${name}". Hãy đổi trạng thái của các việc đó trước khi xóa.`); return; }
  if (!confirm(n ? `Có ${n} công việc đang dùng "${name}". Xóa sẽ bỏ nhãn này khỏi các việc đó. Tiếp tục?` : `Xóa "${name}"?`)) return;
  if (type === "dauMoi") {
    delete DAU_MOI[name];
    setCatOrder("dauMoi", orderedNames("dauMoi"));
    tasks.forEach((t) => { t.dauMoi = t.dauMoi.filter((d) => d !== name); });
  } else if (type === "trangThai") {
    delete TRANG_THAI[name];
    setCatOrder("trangThai", orderedNames("trangThai"));
    DA_XONG = DA_XONG.filter((s) => s !== name);
  } else {
    PHU_TRACH = PHU_TRACH.filter((p) => p !== name);
    setCatOrder("phuTrach", PHU_TRACH.slice());
    tasks.forEach((t) => { if (t.phuTrach === name) t.phuTrach = ""; });
  }
}

function afterMgrChange() { syncCatOrder(); save(); saveCats(); renderMgr(); render(); }

$("btnMgr").onclick = () => { renderMgr(); mgr.showModal(); };
$("btnMgrClose").onclick = () => mgr.close();

$("mgrBody").addEventListener("click", (e) => {
  const { act, type, name } = e.target.dataset;
  if (act === "add") {
    const input = e.target.parentElement.querySelector("[data-new]");
    const color = e.target.parentElement.querySelector("[data-new-color]")?.value;
    addCat(type, input.value, color);
    afterMgrChange();
  } else if (act === "del") {
    deleteCat(type, name);
    afterMgrChange();
  }
});
$('mgrBody').addEventListener("dragstart", (e) => {
  const row = e.target.closest(".mrow");
  if (!row) return;
  e.dataTransfer?.setData("text/plain", row.dataset.name);
  e.dataTransfer.effectAllowed = "move";
  row.classList.add("dragging");
});

$('mgrBody').addEventListener("dragover", (e) => {
  const row = e.target.closest(".mrow");
  if (!row) return;
  e.preventDefault();
  row.classList.add("drag-over");
});

$('mgrBody').addEventListener("dragleave", (e) => {
  const row = e.target.closest(".mrow");
  if (!row) return;
  row.classList.remove("drag-over");
});

$('mgrBody').addEventListener("drop", (e) => {
  const row = e.target.closest(".mrow");
  if (!row) return;
  e.preventDefault();
  const fromName = e.dataTransfer?.getData("text/plain") || row.dataset.name;
  const toName = row.dataset.name;
  if (!fromName || !toName || fromName === toName) return;
  const type = row.dataset.type;
  reorderCat(type, fromName, toName);
  afterMgrChange();
  row.classList.remove("drag-over");
});

$('mgrBody').addEventListener("dragend", (e) => {
  const row = e.target.closest(".mrow");
  if (!row) return;
  row.classList.remove("dragging", "drag-over");
});
$("mgrBody").addEventListener("change", (e) => {
  const { act, type, name } = e.target.dataset;
  if (act === "rename") renameCat(type, name, e.target.value);
  else if (act === "color") catMap(type)[name] = e.target.value;
  else if (act === "done") {
    DA_XONG = e.target.checked ? [...new Set([...DA_XONG, name])] : DA_XONG.filter((s) => s !== name);
  } else return;
  afterMgrChange();
});

$("mgrBody").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset.new) {
    e.preventDefault();
    const color = e.target.parentElement.querySelector("[data-new-color]")?.value;
    addCat(e.target.dataset.new, e.target.value, color);
    afterMgrChange();
  }
});

// ===== Nút X đóng mọi cửa sổ =====
document.querySelectorAll("[data-close]").forEach((b) => {
  b.addEventListener("click", () => b.closest("dialog").close());
});

// ===== Tick nhanh cột Qui trình (có hỏi xác nhận Có/Không) =====
function askYesNo(msg) {
  return new Promise((resolve) => {
    const cf = $("cf");
    $("cfMsg").textContent = msg;
    const done = (v) => { cf.close(); resolve(v); };
    $("cfYes").onclick = () => done(true);
    $("cfNo").onclick = () => done(false);
    cf.oncancel = () => resolve(false); // bấm Esc = Không
    cf.showModal();
  });
}

$("rows").addEventListener("change", async (e) => {
  const id = e.target.dataset.qt;
  if (!id) return;
  const checked = e.target.checked;
  const ok = await askYesNo("Bạn xác định thay đổi trạng thái qui trình?");
  if (ok) {
    tasks.find((t) => t.id == id).quiTrinh = checked;
    save();
  }
  render(); // vẽ lại: nếu chọn Không thì ô tick trở về như cũ
});

const importDlg = $("importDlg");
let pendingImport = null;
let xlsxLoadPromise = null;
const IMPORT_FIELD_ALIASES = {
  stt: ["stt", "sothutu"],
  dauMoi: ["daumoi"],
  maBV: ["mabv", "mabenhvien"],
  noiDung: ["noidungtheodoi", "noidung", "tencongviec"],
  ghiChu: ["ghichu"],
  quiTrinh: ["quytrinh", "quitrinh"],
  ngayHop: ["ngayhop"],
  deadline: ["deadline", "hannop"],
  status: ["trangthai"],
  phuTrach: ["phutrach"],
  logYC: ["logyeucau", "logyc"],
  bienBan: ["bienbanlamro", "bienban"],
};
const normalizedImportHeader = (value) => String(value ?? "").trim().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
const IMPORT_HEADER_KEYS = new Map(Object.entries(IMPORT_FIELD_ALIASES).flatMap(([key, aliases]) =>
  aliases.map((alias) => [normalizedImportHeader(alias), key])));

function ensureXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoadPromise) {
    xlsxLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("Không tải được bộ đọc Excel."));
      script.onerror = () => { xlsxLoadPromise = null; reject(new Error("Không tải được bộ đọc Excel. Hãy kiểm tra kết nối mạng rồi thử lại.")); };
      document.head.appendChild(script);
    });
  }
  return xlsxLoadPromise;
}

function excelDateToIso(value, XLSX) {
  if (value === "" || value === null || value === undefined) return "";
  const toIso = (year, month, day) => `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toIso(value.getFullYear(), value.getMonth() + 1, value.getDate());
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date && date.y && date.m && date.d) return toIso(date.y, date.m, date.d);
    return null;
  }
  const text = String(value).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso) return toIso(iso[1], iso[2], iso[3]);
  const local = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text);
  if (local) return displayDateToIso(`${local[1].padStart(2, "0")}/${local[2].padStart(2, "0")}/${local[3]}`);
  return null;
}

function parseExcelRows(rows, XLSX, outlineRows = [], rowStart = 0) {
  let headerIndex = -1, columns = {}, bestScore = 0;
  rows.slice(0, 20).forEach((row, index) => {
    const candidate = {};
    row.forEach((cell, columnIndex) => {
      const key = IMPORT_HEADER_KEYS.get(normalizedImportHeader(cell));
      if (key && candidate[key] === undefined) candidate[key] = columnIndex;
    });
    const score = Object.keys(candidate).length;
    if (candidate.noiDung !== undefined && score > bestScore) {
      headerIndex = index;
      columns = candidate;
      bestScore = score;
    }
  });
  if (headerIndex < 0) throw new Error("Không tìm thấy hàng tiêu đề có cột Nội dung theo dõi.");

  let skippedEmpty = 0, skippedInvalid = 0;
  const records = [];
  let currentOutlineParent = null;
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    if (!row.some((cell) => String(cell ?? "").trim())) { skippedEmpty++; return; }
    const raw = (key) => columns[key] === undefined ? "" : row[columns[key]] ?? "";
    const text = (key) => String(raw(key) ?? "").trim();
    const noiDung = text("noiDung");
    if (!noiDung) { skippedInvalid++; return; }
    const ngayHop = excelDateToIso(raw("ngayHop"), XLSX);
    const deadline = excelDateToIso(raw("deadline"), XLSX);
    if (ngayHop === null || deadline === null) { skippedInvalid++; return; }
    const rawStt = text("stt");
    const numericStt = rawStt ? Number(rawStt) : 0;
    const quiTrinh = raw("quiTrinh");
    const quiTrinhText = normalizedImportHeader(quiTrinh);
    const rowIndex = rowStart + headerIndex + offset + 1;
    const outlineLevel = Number(outlineRows[rowIndex]?.level) || 0;
    const parentIndex = outlineLevel > 0 && currentOutlineParent !== null ? currentOutlineParent : null;
    const recordIndex = records.length;
    records.push({
      stt: Number.isSafeInteger(numericStt) && numericStt > 0 ? numericStt : null,
      outlineLevel,
      parentIndex,
      dauMoi: text("dauMoi").split(/[;,|\n]+/).map((name) => name.trim()).filter(Boolean),
      maBV: text("maBV"), noiDung, ghiChu: text("ghiChu"),
      quiTrinh: typeof quiTrinh === "boolean" ? quiTrinh : ["co", "yes", "true", "1", "x"].includes(quiTrinhText),
      ngayHop, deadline, status: text("status") || Object.keys(TRANG_THAI)[0] || "",
      phuTrach: text("phuTrach"), logYC: text("logYC"), bienBan: text("bienBan"),
    });
    if (outlineLevel === 0) currentOutlineParent = recordIndex;
  });
  return {
    records, skippedEmpty, skippedInvalid, headerIndex, mappedColumns: bestScore,
    groupedChildren: records.filter((record) => record.parentIndex !== null).length,
  };
}

function showImportPreview(fileName, sheetName, result) {
  pendingImport = result.records.length ? result : null;
  $("importFileName").textContent = `${fileName} · ${sheetName}`;
  $("importStatus").textContent = result.records.length ? "" : "Không có dòng hợp lệ để nhập.";
  $("importStatus").classList.toggle("error", !result.records.length);
  $("importSummary").textContent = `Tìm thấy ${result.records.length} công việc, nhận diện ${result.groupedChildren} nội dung con từ nhóm hàng Excel · Bỏ qua ${result.skippedEmpty} dòng trống và ${result.skippedInvalid} dòng không hợp lệ.`;
  $("importPreviewRows").innerHTML = result.records.slice(0, 8).map((task) => `
    <tr><td>${task.stt ?? "Tự cấp"}</td><td>${esc(task.maBV)}</td><td>${task.parentIndex !== null ? "↳ " : ""}${esc(task.noiDung)}</td><td>${fmt(task.deadline)}</td><td>${esc(task.status)}</td></tr>`).join("");
  $("importPreview").hidden = false;
  importDlg.querySelector('[name="importMode"][value="append"]').checked = true;
  $("btnImportCommit").textContent = "Nhập công việc";
  $("btnImportCommit").disabled = !pendingImport;
}

$("btnImport").onclick = () => $("importFile").click();
$("importFile").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  pendingImport = null;
  $("importFileName").textContent = file.name;
  $("importStatus").textContent = "Đang đọc tệp...";
  $("importStatus").classList.remove("error");
  $("importSummary").textContent = "";
  $("importPreview").hidden = true;
  $("btnImportCommit").disabled = true;
  if (!importDlg.open) importDlg.showModal();
  try {
    const XLSX = await ensureXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Tệp không có trang tính.");
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "", blankrows: true });
    const rowStart = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]).s.r : 0;
    showImportPreview(file.name, sheetName, parseExcelRows(rows, XLSX, sheet["!rows"] || [], rowStart));
  } catch (error) {
    $("importStatus").textContent = error.message || "Không đọc được tệp Excel.";
    $("importStatus").classList.add("error");
  }
});

importDlg.addEventListener("change", (e) => {
  if (e.target.name !== "importMode") return;
  $("btnImportCommit").textContent = e.target.value === "replace" ? "Thay thế danh sách" : "Nhập công việc";
});
$("btnImportCancel").onclick = () => importDlg.close();
importDlg.addEventListener("close", () => { pendingImport = null; });

$("btnImportCommit").addEventListener("click", () => {
  if (!pendingImport?.records.length) return;
  const mode = importDlg.querySelector('[name="importMode"]:checked').value;
  const usedStts = new Set((mode === "append" ? tasks : []).map((task) => Number(task.stt)).filter(Number.isSafeInteger));
  let availableBank = mode === "append" ? sttBank.slice() : [];
  const allocateStt = () => {
    let stt;
    if (mode === "append") {
      const index = availableBank.findIndex((value) => !usedStts.has(value));
      if (index >= 0) stt = availableBank.splice(index, 1)[0];
    }
    if (stt === undefined) {
      stt = mode === "append" ? Math.max(0, ...usedStts) + 1 : 1;
      while (usedStts.has(stt)) stt++;
    }
    usedStts.add(stt);
    return stt;
  };
  const existingIds = new Set((mode === "append" ? tasks : []).map((task) => String(task.id)));
  let nextId = Date.now();
  const imported = pendingImport.records.map((record) => {
    let stt = record.stt;
    if (!Number.isSafeInteger(stt) || stt < 1 || usedStts.has(stt)) stt = allocateStt();
    else {
      usedStts.add(stt);
      availableBank = availableBank.filter((value) => value !== stt);
    }
    while (existingIds.has(String(nextId))) nextId++;
    const id = nextId++;
    existingIds.add(String(id));
    const { parentIndex, outlineLevel, ...taskFields } = record;
    return { ...taskFields, id, stt, parentId: null };
  });
  imported.forEach((task, index) => {
    const parentIndex = pendingImport.records[index].parentIndex;
    if (Number.isInteger(parentIndex) && imported[parentIndex]) task.parentId = imported[parentIndex].id;
  });

  imported.forEach((task) => {
    task.dauMoi.forEach((name) => {
      if (!Object.prototype.hasOwnProperty.call(DAU_MOI, name)) DAU_MOI[name] = nextColor(DAU_MOI);
    });
    if (task.status && !Object.prototype.hasOwnProperty.call(TRANG_THAI, task.status)) TRANG_THAI[task.status] = nextColor(TRANG_THAI);
    if (task.phuTrach && !PHU_TRACH.includes(task.phuTrach)) PHU_TRACH.push(task.phuTrach);
  });
  tasks = mode === "append" ? [...tasks, ...imported] : imported;
  sttBank = availableBank;
  renumberTasksByGroup();
  syncCatOrder();
  save(); saveSttBank(); saveCats();
  $("fSearch").value = "";
  quickFilter = "";
  Object.keys(filters).forEach((key) => delete filters[key]);
  closePop();
  importDlg.close();
  render();
});

render();
