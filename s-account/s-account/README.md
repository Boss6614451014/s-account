# S ACCOUNT — ระบบจัดการสำนักงานบัญชี

เว็บแอพบันทึกข้อมูลบัญชี ภาษี และเอกสารสำหรับสำนักงานบัญชี  
ใช้ **Supabase** เป็น backend (ไม่ต้องมี server เอง)

---

## 🗂 โครงสร้างโปรเจค

```
s-account/
├── index.html          ← หน้าเว็บหลัก
├── src/
│   ├── style.css       ← สไตล์ชีท
│   └── app.js          ← logic + Supabase client
└── sql/
    └── schema.sql      ← SQL สำหรับใส่ใน Supabase
```

---

## 🚀 วิธีติดตั้ง

### ขั้นที่ 1 — สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง project ใหม่
2. ไปที่ **SQL Editor** → วางโค้ดจาก `sql/schema.sql` แล้วกด Run
3. ไปที่ **Settings → API** → copy **Project URL** และ **anon public key**

### ขั้นที่ 2 — Deploy เว็บ

**วิธี A — GitHub Pages (ฟรี)**
```bash
# 1. สร้าง repo ใน GitHub
# 2. อัพโหลดไฟล์ทั้งหมด
# 3. Settings → Pages → Source: main branch
# เว็บจะอยู่ที่ https://username.github.io/s-account
```

**วิธี B — เปิดไฟล์ local**
```
เปิดไฟล์ index.html ใน browser ได้เลย
```

### ขั้นที่ 3 — เชื่อมต่อ Supabase

1. เปิดเว็บ → กดปุ่ม **⚙ ตั้งค่า DB** มุมขวาบน
2. ใส่ Supabase URL และ Anon Key
3. กด **บันทึก & เชื่อมต่อ**

---

## 📋 ตาราง SQL (5 กลุ่ม)

| ตาราง | คำอธิบาย | คอลัมน์หลัก |
|---|---|---|
| `customers` | ข้อมูลพื้นฐานลูกค้า | รหัส, เลขทะเบียน, ชื่อ |
| `withholding_tax` | ภาษีหัก ณ ที่จ่าย | ภ.ง.ด.1/3/53 |
| `vat_pp30` | ภ.พ.30 / VAT | งวด, ยอดขาย, ยอดซื้อ, ภาษี |
| `document_tracking` | ติดตามเอกสาร | 16 คอลัมน์วันที่ |
| `service_fees` | ค่าบริการ / การเงิน | ค่าทำบัญชี, สปส, ค่าแรง |

---

## ✨ ฟีเจอร์

- ✅ บันทึกลูกค้า แยกประเภท (ลูกค้า / บริษัท / หจก)
- ✅ บันทึกภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1, 3, 53)
- ✅ บันทึก ภ.พ.30 / VAT รายงวด
- ✅ ติดตามเอกสาร 16 รอบ (คลิกติ๊กได้ทันที)
- ✅ บันทึกค่าบริการและค่าใช้จ่ายรายเดือน
- ✅ ค้นหาลูกค้าได้จากรหัส / ชื่อ / เลขทะเบียน
- ✅ Dashboard สรุปข้อมูล

---

## 🔐 ความปลอดภัย

- ใช้ Supabase Row Level Security (RLS)
- เฉพาะผู้ใช้ที่ login (authenticated) เข้าถึงข้อมูลได้
- API Key เก็บใน localStorage ของเบราว์เซอร์ผู้ใช้
