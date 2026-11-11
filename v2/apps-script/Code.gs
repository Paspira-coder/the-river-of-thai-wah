/**
 * THE RIVER OF THAI WAH — v2 backend (Google Apps Script)
 * ผูกกับ Google Sheet ที่มีชีต "Employees" (รายชื่อรหัสพนักงาน) — ระบบจะสร้างชีต "Participants" ให้ตอน Export
 *
 * หน้าที่: ตรวจรหัสผ่าน Admin ฝั่ง Server · ส่งข้อมูลให้ Admin Dashboard · Export Google Sheets
 *          · สุ่ม Lucky Krathong (สุ่มฝั่ง Server + ล็อกผล) · ซิงก์รายชื่อพนักงาน (เก็บเป็นค่าแฮช)
 * เชื่อม Firebase ด้วย OAuth ของเจ้าของสคริปต์ (ต้องเป็นบัญชีเดียวกับเจ้าของโปรเจกต์ Firebase) — ไม่ต้องใช้ API key / secret
 *
 * ตั้งค่า (Project Settings > Script properties) — ไม่ใส่ก็ใช้ค่าเริ่มต้นด้านล่าง:
 *   ADMIN_PIN       รหัสผ่าน Admin (ฟังก์ชัน setup() ตั้งค่าเริ่มต้นเป็น 1234 สำหรับต้นแบบ — ควรเปลี่ยน)
 *   DB_URL, ROOT, ID_SALT, EMPLOYEE_SHEET, EXPORT_SHEET
 */
const DEFAULTS = {
  DB_URL: 'https://the-river-of-thai-wah-default-rtdb.asia-southeast1.firebasedatabase.app',
  ROOT: 'v2',
  ID_SALT: 'TW-LOYKRATHONG-2026',   // ต้องตรงกับ CONFIG.ID_SALT ในหน้าเว็บ
  EMPLOYEE_SHEET: 'Employees',
  EXPORT_SHEET: 'Participants',
};
const ANSWER_KEY = 'AABBA';
const DESIGN_NAMES = { 1: 'CLASSIC SINGLE LAYER', 2: 'DOUBLE LAYER', 3: 'LOTUS BLOOM', 4: 'ICE KRATHONG', 5: 'BREAD KRATHONG', 6: 'FLOWER FESTIVAL' };
const RIVER_NAMES = { r1: 'BL RIVER', r2: 'TDC RIVER', r3: 'TKT RIVER', r4: 'TWFN RIVER', r5: 'TN RIVER', r6: 'MS RIVER', r7: 'BANGKOK RIVER', r8: 'THAI WAH RIVER' };

/** รันครั้งแรกจากหน้า Editor (เลือก setup แล้วกด Run) เพื่ออนุญาตสิทธิ์และตั้งค่าเริ่มต้น */
function setup() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('ADMIN_PIN')) p.setProperty('ADMIN_PIN', '1234');
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(cfg('EMPLOYEE_SHEET'))) ss.insertSheet(cfg('EMPLOYEE_SHEET')).getRange('A1').setValue('Employee ID');
  rtdb('get', cfg('ROOT') + '/employees', undefined, 'shallow=true'); // ทดสอบการเชื่อมต่อ Firebase
  return 'setup ok';
}

function cfg(k) { return PropertiesService.getScriptProperties().getProperty(k) || DEFAULTS[k]; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json({ ok: true, service: 'the-river-of-thai-wah v2' }); }

function doPost(e) {
  let req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return json({ ok: false, error: 'bad request' }); }
  try {
    const pinErr = checkPin(req.pin);
    if (pinErr) return json({ ok: false, error: pinErr });
    switch (req.action) {
      case 'login': return json({ ok: true });
      case 'adminData': return json(adminData());
      case 'export': return json(exportSheet());
      case 'syncEmployees': return json(syncEmployees());
      case 'drawNext': return json(drawNext());
      case 'resetDraw': rtdb('delete', cfg('ROOT') + '/draw'); return json({ ok: true, draw: { winners: [], locked: false } });
      case 'resetAll':
        rtdb('patch', cfg('ROOT'), { submissions: null, done: null, rivers: null, progress: null, draw: null });
        return json({ ok: true });
      default: return json({ ok: false, error: 'unknown action' });
    }
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

/** PIN check with brute-force lock: 5 wrong attempts → locked 30 seconds */
function checkPin(pin) {
  const cache = CacheService.getScriptCache();
  if (cache.get('pin_lock')) return 'ใส่รหัสผิดหลายครั้ง กรุณารอ 30 วินาที';
  const ok = String(pin || '') === String(cfg('ADMIN_PIN') || '1234');
  if (ok) { cache.remove('pin_fails'); return ''; }
  const n = Number(cache.get('pin_fails') || 0) + 1;
  if (n >= 5) { cache.put('pin_lock', '1', 30); cache.remove('pin_fails'); } else cache.put('pin_fails', String(n), 300);
  return 'รหัสผ่านไม่ถูกต้อง';
}

/** Firebase Realtime Database REST call using the script owner's OAuth token */
function rtdb(method, path, body, query) {
  const url = cfg('DB_URL') + '/' + path + '.json?access_token=' + encodeURIComponent(ScriptApp.getOAuthToken()) + (query ? '&' + query : '');
  const opt = { method: method, muteHttpExceptions: true, contentType: 'application/json' };
  if (body !== undefined) opt.payload = JSON.stringify(body);
  const r = UrlFetchApp.fetch(url, opt), code = r.getResponseCode(), txt = r.getContentText();
  if (code >= 300) throw new Error('Firebase ' + code + ': ' + txt.slice(0, 200));
  return txt ? JSON.parse(txt) : null;
}

function normId(s) { return String(s == null ? '' : s).toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9_-]/g, '').slice(0, 32); }
function hashId(id) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cfg('ID_SALT') + '|' + id, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}
function scoreOf(answers) { let s = 0; for (let i = 0; i < 5; i++) if (String(answers || '')[i] === ANSWER_KEY[i]) s++; return s; }

function loadRows() {
  const subs = rtdb('get', cfg('ROOT') + '/submissions') || {};
  return Object.keys(subs).map(function (k) {
    const s = subs[k] || {}, answers = String(s.answers || '');
    return {
      key: k, employeeId: String(s.employeeId || ''), design: Number(s.design) || 0, answers: answers, score: scoreOf(answers),
      quizCompleted: answers.length === 5, river: String(s.river || ''), wish: String(s.wish || ''), at: Number(s.at) || 0,
      status: String(s.status || ''), submissionId: String(s.submissionId || ''), idValid: hashId(normId(s.employeeId)) === k,
    };
  });
}
function drawState() {
  const d = rtdb('get', cfg('ROOT') + '/draw') || {}, w = d.winners || {};
  const winners = Object.keys(w).map(function (k) { return w[k]; }).filter(Boolean).sort(function (a, b) { return a.rank - b.rank; });
  return { winners: winners, locked: winners.length >= 5 };
}
function adminData() {
  const root = cfg('ROOT');
  const rows = loadRows();
  const prog = rtdb('get', root + '/progress') || {};
  const emp = rtdb('get', root + '/employees', undefined, 'shallow=true') || {};
  const keys = {}; Object.keys(prog).forEach(function (k) { keys[k] = 1; }); rows.forEach(function (r) { keys[r.key] = 1; });
  const quizDone = Object.keys(keys).filter(function (k) { return prog[k] === 'QUIZ COMPLETED' || prog[k] === 'PARTICIPATION COMPLETED' || rows.some(function (r) { return r.key === k; }); }).length;
  const completed = rows.filter(function (r) { return r.status === 'PARTICIPATION COMPLETED'; }).length;
  return {
    ok: true, rows: rows, draw: drawState(),
    stats: { participants: Object.keys(keys).length, quizPlayers: Object.keys(keys).length, quizCompleted: quizDone, drawEntries: completed, employees: Object.keys(emp).length },
  };
}

function exportSheet() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(cfg('EXPORT_SHEET')) || ss.insertSheet(cfg('EXPORT_SHEET'));
  const rows = loadRows().sort(function (a, b) { return a.at - b.at; });
  const head = ['Employee ID', 'Krathong Design', 'Quiz Answer 1', 'Quiz Answer 2', 'Quiz Answer 3', 'Quiz Answer 4', 'Quiz Answer 5', 'Quiz Score', 'Quiz Completion Status', 'Selected Location', 'Wish Message', 'Submission Date & Time', 'Participation Status', 'Submission ID'];
  const data = rows.map(function (r) {
    const a = r.answers.split('');
    return [r.employeeId, DESIGN_NAMES[r.design] || r.design, a[0] || '', a[1] || '', a[2] || '', a[3] || '', a[4] || '', r.score + '/5',
      r.quizCompleted ? 'COMPLETED' : 'NOT COMPLETED', RIVER_NAMES[r.river] || r.river, r.wish,
      r.at ? Utilities.formatDate(new Date(r.at), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss') : '', r.status, r.submissionId];
  });
  sh.clearContents();
  sh.getRange(1, 1, Math.max(1, data.length + 1), 1).setNumberFormat('@'); // keep leading zeros of Employee ID
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  if (data.length) sh.getRange(2, 1, data.length, head.length).setValues(data);
  sh.setFrozenRows(1);
  return { ok: true, count: data.length, url: ss.getUrl() + '#gid=' + sh.getSheetId() };
}

function syncEmployees() {
  const sh = SpreadsheetApp.getActive().getSheetByName(cfg('EMPLOYEE_SHEET'));
  if (!sh) throw new Error('ไม่พบชีต "' + cfg('EMPLOYEE_SHEET') + '"');
  const vals = sh.getDataRange().getDisplayValues();
  if (!vals.length) throw new Error('ชีตรายชื่อพนักงานว่าง');
  let col = vals[0].findIndex(function (h) { return /employee|emp\s*id|รหัส/i.test(String(h)); });
  let start = 1;
  if (col < 0) { col = 0; start = /\d/.test(String(vals[0][0])) ? 0 : 1; } // no header row → first row is already an ID
  const out = {};
  for (let i = start; i < vals.length; i++) { const id = normId(vals[i][col]); if (id.length >= 3) out[hashId(id)] = true; }
  rtdb('put', cfg('ROOT') + '/employees', out);
  return { ok: true, count: Object.keys(out).length };
}

function drawNext() {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const st = drawState();
    if (st.winners.length >= 5) throw new Error('สุ่มครบ 5 รางวัลแล้ว (กด RESET DRAW ถ้าต้องการสุ่มใหม่)');
    const taken = {}; st.winners.forEach(function (w) { taken[w.key] = 1; });
    const pool = loadRows().filter(function (r) { return r.status === 'PARTICIPATION COMPLETED' && !taken[r.key]; });
    if (!pool.length) throw new Error('ไม่มีผู้มีสิทธิ์เหลือให้สุ่ม');
    const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Date.now() + Math.random());
    const u32 = (((d[0] & 255) << 24) >>> 0) + ((d[1] & 255) << 16) + ((d[2] & 255) << 8) + (d[3] & 255);
    const pick = pool[u32 % pool.length], rank = st.winners.length + 1;
    const w = { rank: rank, key: pick.key, employeeId: pick.employeeId, design: pick.design, river: pick.river, at: Date.now() };
    rtdb('put', cfg('ROOT') + '/draw/winners/r' + rank, w);
    st.winners.push(w);
    return { ok: true, winner: w, draw: { winners: st.winners, locked: st.winners.length >= 5 } };
  } finally { lock.releaseLock(); }
}
