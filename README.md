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
