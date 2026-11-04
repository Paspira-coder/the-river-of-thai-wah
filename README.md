# THE RIVER OF THAI WAH 🪷

> One River. Countless Krathongs. Countless Wishes.

เว็บแอปกิจกรรมลอยกระทงออนไลน์ของ Thai Wah — ไฟล์เดียว (`index.html`) HTML + CSS + JavaScript ล้วน ไม่ใช้ framework

| ส่วน | การใช้งาน |
|---|---|
| หน้าพนักงาน (มือถือ) | กรอกชื่อ → ถ่าย/อัปโหลดรูปกระทง → ตัดพื้นหลังในเครื่อง → อธิษฐาน → ลอยกระทง (1 เครื่อง / 1 กระทง) |
| หน้าแอดมิน (จอใหญ่) | เมนู **แอดมิน** → ใส่รหัส → แม่น้ำแสดงกระทงทุกใบแบบเรียลไทม์, ★ LUCKY KRATHONG สุ่ม 5 คน, ↻ RESET RIVER |

## ลิงก์เล่นเกม

- พนักงาน: https://paspira-coder.github.io/the-river-of-thai-wah/
- จอแอดมิน: https://paspira-coder.github.io/the-river-of-thai-wah/#admin (รหัส 1234)
- ฐานข้อมูล: Firebase Realtime Database `the-river-of-thai-wah` (Singapore)

## เริ่มใช้งาน

1. **ทดลอง (โหมดเดโม)** — เปิด `index.html` ได้ทันที ข้อมูลเก็บใน localStorage ของเบราว์เซอร์นั้น (เปิด 2 แท็บ: แท็บหนึ่งเป็นพนักงาน อีกแท็บเป็นแอดมิน จะเห็นกระทงลอยแบบเรียลไทม์)
   - เพิ่มกระทงตัวอย่าง: `index.html?seed=60` (ใช้ได้เฉพาะโหมดเดโม)
2. **ใช้งานจริง** — ใส่ URL ของ Firebase Realtime Database ที่ `CONFIG.DB_URL` ด้านบนของสคริปต์ หรือแนบในลิงก์ `index.html?db=https://<project>-default-rtdb.asia-southeast1.firebasedatabase.app`
   - นำ `database.rules.json` ไปตั้งเป็น Security Rules ของ Realtime Database
   - เปิดหน้าแอดมินตรงได้ด้วย `index.html#admin`

## ค่าตั้งค่า (CONFIG ใน index.html)

| ค่า | ความหมาย |
|---|---|
| `DB_URL` | URL ฐานข้อมูล (ว่าง = โหมดเดโม) |
| `ADMIN_HASH` | SHA-256 ของรหัสแอดมิน (ค่าเริ่มต้น = `1234`) — เปลี่ยนโดยเปิด Console แล้วพิมพ์ `await sha256Hex('รหัสใหม่')` |
| `ADMIN_MAX_TRIES` / `ADMIN_LOCK_MS` | ผิด 5 ครั้ง ล็อก 30 วินาที |
| `WINNERS` | จำนวนผู้โชคดี (5) |

## โครงสร้างข้อมูล

```
krathongs/<deviceId>   { name, img (PNG โปร่งใส ≤256px), wish, status, lucky, luckyRank, at }
originals/<deviceId>   { img (JPEG ต้นฉบับ), name, at }
draw/result            { locked, lockedAt, total, winners: { r1..r5: { id, name, rank, at } } }
```

## หมายเหตุ

- เป็นเกมกิจกรรม ไม่ต้องล็อกอิน — รหัสแอดมินใช้กันกดเข้าหน้าแอดมินโดยไม่ตั้งใจเท่านั้น
- กด **↻ RESET RIVER** หลังทดสอบ และหลังจบกิจกรรม
