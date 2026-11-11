# THE RIVER OF THAI WAH 🪷

> One River. Countless Krathongs. Countless Wishes.

เว็บแอปกิจกรรมลอยกระทงออนไลน์ของ Thai Wah — ไฟล์เดียว (`index.html`) HTML + CSS + JavaScript ล้วน ไม่ใช้ framework

| ส่วน | การใช้งาน |
|---|---|
| หน้าเล่นเกม (มือถือ) | กรอกชื่อ → ถ่าย/อัปโหลดรูปกระทง → ตัดพื้นหลังในเครื่อง → อธิษฐาน → ลอยกระทง (1 เครื่อง / 1 กระทง) |
| หน้าแอดมิน (จอใหญ่) | เมนู **แอดมิน** → ใส่รหัส → แม่น้ำแสดงกระทงทุกใบแบบเรียลไทม์, ★ LUCKY KRATHONG สุ่ม 5 คน, ↻ RESET RIVER |

## ลิงก์เล่นเกม

- เล่นเกม: https://paspira-coder.github.io/the-river-of-thai-wah/
- จอแอดมิน: https://paspira-coder.github.io/the-river-of-thai-wah/#admin (รหัส 1234)

## รูปแบบการเล่น (เรียลไทม์)

- พนักงานเปิดลิงก์บนมือถือของตัวเอง ลอยได้ 1 กระทงต่อ 1 เครื่อง → กระทงขึ้นจอแอดมินทันที (ป้ายมุมซ้ายบนขึ้น ● LIVE)
- ฐานข้อมูลกลาง: Firebase Realtime Database `the-river-of-thai-wah` (สิงคโปร์) — Rules อยู่ใน `database.rules.json`
- เก็บเฉพาะชื่อ + ภาพกระทงที่ตัดพื้นหลังแล้ว ไม่เก็บภาพต้นฉบับ ไม่เก็บคำอธิษฐาน
- จบกิจกรรมกด **↻ RESET RIVER** เพื่อล้างข้อมูลทั้งหมด

## ค่าตั้งค่า (CONFIG ใน index.html)

| ค่า | ความหมาย |
|---|---|
| `DB_URL` | URL ฐานข้อมูลกลาง (ว่าง = โหมดเดโม เล่นบนเครื่องเดียว) |
| `ADMIN_HASH` | SHA-256 ของรหัสแอดมิน (ค่าเริ่มต้น = `1234`) — เปลี่ยนโดยเปิด Console แล้วพิมพ์ `await sha256Hex('รหัสใหม่')` |
| `ADMIN_MAX_TRIES` / `ADMIN_LOCK_MS` | ผิด 5 ครั้ง ล็อก 30 วินาที |
| `WINNERS` | จำนวนผู้โชคดี (5) |

## โครงสร้างข้อมูล

```
krathongs/<id>   { name, img (PNG/WebP โปร่งใส ≤256px), status, lucky, luckyRank, at }
draw/result      { locked, lockedAt, total, winners: { r1..r5: { id, name, rank, at } } }
```

## หมายเหตุ

- เป็นเกมกิจกรรม ไม่ต้องล็อกอิน — รหัสแอดมินใช้กันกดเข้าหน้าแอดมินโดยไม่ตั้งใจเท่านั้น
- กด **↻ RESET RIVER** หลังทดสอบ และหลังจบกิจกรรม

---

# v2 · DIGITAL LOY KRATHONG (แยกจากเวอร์ชันแรก)

ลิงก์: https://paspira-coder.github.io/the-river-of-thai-wah/v2/ — ไฟล์อยู่ในโฟลเดอร์ `v2/`

**พนักงาน:** กรอกรหัสพนักงาน → เลือกกระทง 6 แบบ → Quiz 5 ข้อ → ดูคะแนน → เลือกแม่น้ำ 8 แห่ง → อธิษฐาน → ลอยกระทง (เห็นกระทงเพื่อนในแม่น้ำเดียวกันแบบเรียลไทม์) → SAVE MY KRATHONG (PNG)
**Admin:** ปุ่ม ADMIN LOGIN หน้าแรก → Overview / Live Rivers / Participants / Quiz Analytics / Krathong Design / Lucky Krathong / Export & Settings

## โครงสร้างข้อมูล (Firebase Realtime Database โหนด `v2`)

| โหนด | ใครอ่านได้ | เนื้อหา |
|---|---|---|
| `progress/<hash>` | ทีละรหัส | IN PROGRESS / QUIZ COMPLETED / PARTICIPATION COMPLETED |
| `submissions/<hash>` | **Admin เท่านั้น** (ผ่าน Apps Script) | Employee ID, กระทง, คำตอบ 5 ข้อ, คะแนน, แม่น้ำ, คำอธิษฐาน, เวลา, สถานะ, Submission ID |
| `done/<hash>` | ทีละรหัส | แม่น้ำที่ลอยแล้ว (ใช้กันส่งซ้ำ / ดูผลเดิม) |
| `rivers/<r1..r8>/<hash>` | ทุกคน | ป้ายรหัสแบบปิดบางส่วน + แบบกระทง + เวลา (ใช้แสดงแม่น้ำแบบเรียลไทม์) |
| `draw` | **Admin เท่านั้น** | ผล Lucky Krathong |

พนักงานกรอกรหัสพนักงานเอง (ตัวเลข เช่น 20230260) ไม่ต้องตรวจกับรายชื่อ · กันส่งซ้ำที่ฝั่ง Server ด้วย Security Rules: 1 รหัสเขียน `submissions` ได้ครั้งเดียว (Rules อยู่ใน `database.rules.json`)

ทุกครั้งที่กด FLOAT ระบบบันทึกแถวลง Google Sheet ชีต **Participants** อัตโนมัติ (Apps Script อ่านข้อมูลจาก Firebase เอง)

## ตั้งค่าระบบหลังบ้าน (Google Apps Script) — จำเป็นสำหรับ Admin / Export / Lucky Draw / รายชื่อพนักงาน

1. เปิด Google Sheet (ใช้บัญชี Google เดียวกับเจ้าของโปรเจกต์ Firebase)
2. เมนู Extensions → Apps Script → วางโค้ดจาก `v2/apps-script/Code.gs` และเปิด Project Settings → "Show appsscript.json" แล้ววางเนื้อหา `v2/apps-script/appsscript.json`
3. เลือกฟังก์ชัน `setup` → Run → อนุญาตสิทธิ์ (ตั้งรหัส Admin เริ่มต้น 1234 — เปลี่ยนได้ที่ Project Settings → Script properties → `ADMIN_PIN`)
4. Deploy → New deployment → Web app → Execute as: **Me**, Who has access: **Anyone** → คัดลอก URL ที่ลงท้ายด้วย `/exec`
5. ใส่ URL ที่ `CONFIG.API_URL` ใน `v2/index.html` แล้ว push

## รูปภาพ

- กระทง 6 แบบ: `v2/assets/krathong-1.png` … `krathong-6.png` (ตัดพื้นหลังจากรูปต้นฉบับที่ได้รับ ไม่ได้วาดใหม่)
- แม่น้ำ 8 แห่ง: วางไฟล์ `v2/assets/river-1.jpg` … `river-8.jpg` ตามลำดับ BL, TDC, TKT, TWFN, TN, MS, BANGKOK, THAI WAH — ระหว่างยังไม่มีไฟล์ ระบบแสดงภาพชั่วคราวพร้อมป้าย "รอรูปต้นฉบับ"

## ข้อจำกัดของต้นแบบ

- รหัส Admin ตรวจที่ Apps Script (ไม่อยู่ในหน้าเว็บ) แต่ยังเป็นรหัสเดียวแบบ PIN — ใช้งานจริงควรเปลี่ยนเป็นบัญชีผู้ใช้รายบุคคล
- ข้อมูลส่วนตัว (คำอธิษฐาน คำตอบ รหัสเต็ม) อ่านได้เฉพาะผ่าน Apps Script; ในแม่น้ำแสดงรหัสแบบปิดบางส่วนเท่านั้น
