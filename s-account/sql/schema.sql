-- ================================================================
-- S ACCOUNT - สำนักงานบัญชี
-- Supabase SQL Schema
-- ================================================================

-- ----------------------------------------------------------------
-- 1. ข้อมูลพื้นฐานลูกค้า (Master Customer Data)
-- ----------------------------------------------------------------
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,         -- รหัสลูกค้า (เช่น SM-103)
  tax_id        TEXT,                          -- เลขทะเบียน / เลขประจำตัวผู้เสียภาษี
  name          TEXT NOT NULL,                 -- ชื่อลูกค้า / ร้าน / บริษัท
  doc_deduct    TEXT,                          -- ตามเอกสาร หักณ
  doc_30        TEXT,                          -- ตามเอกสาร 30
  customer_type TEXT CHECK (customer_type IN ('ลูกค้า', 'บริษัท', 'หจก')),
  is_active     BOOLEAN DEFAULT true,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2. ภาษีหัก ณ ที่จ่าย (Withholding Tax)
-- ----------------------------------------------------------------
CREATE TABLE withholding_tax (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
  tax_year        INT  NOT NULL,   -- ปีภาษี (พ.ศ.)
  tax_month       INT  NOT NULL CHECK (tax_month BETWEEN 1 AND 12),

  -- ภ.ง.ด.1 (เงินเดือน)
  pnd1_amount     NUMERIC(15,2) DEFAULT 0,
  pnd1_date       DATE,

  -- ภ.ง.ด.3 เราจ่าย
  pnd3_we_pay     NUMERIC(15,2) DEFAULT 0,
  pnd3_we_date    DATE,

  -- ภ.ง.ด.3 เก็บลูกค้า
  pnd3_collect    NUMERIC(15,2) DEFAULT 0,
  pnd3_col_date   DATE,

  -- ภ.ง.ด.53 เราจ่าย
  pnd53_we_pay    NUMERIC(15,2) DEFAULT 0,
  pnd53_we_date   DATE,

  -- ภ.ง.ด.53 เก็บลูกค้า
  pnd53_collect   NUMERIC(15,2) DEFAULT 0,
  pnd53_col_date  DATE,

  -- ยื่นแบบ หักณที่จ่าย
  filed_date      DATE,
  filed_amount    NUMERIC(15,2) DEFAULT 0,
  filed_ref       TEXT,           -- เลขที่อ้างอิงการยื่น

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (customer_id, tax_year, tax_month)
);

-- ----------------------------------------------------------------
-- 3. ภ.พ.30 / VAT
-- ----------------------------------------------------------------
CREATE TABLE vat_pp30 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,

  period_label    TEXT NOT NULL,  -- เช่น "6/67", "3/68", "11/68", "12/68"
  period_month    INT  NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year     INT  NOT NULL,  -- ปีพ.ศ.

  sales_amount    NUMERIC(15,2) DEFAULT 0,   -- ยอดขาย
  purchase_amount NUMERIC(15,2) DEFAULT 0,   -- ยอดซื้อ
  vat_output      NUMERIC(15,2) DEFAULT 0,   -- ภาษีขาย
  vat_input       NUMERIC(15,2) DEFAULT 0,   -- ภาษีซื้อ
  vat_payable     NUMERIC(15,2) DEFAULT 0,   -- ภาษีที่ต้องชำระ

  filed_date      DATE,
  payment_date    DATE,
  receipt_no      TEXT,           -- เลขที่ใบเสร็จ

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (customer_id, period_year, period_month)
);

-- ----------------------------------------------------------------
-- 4. ติดตามเอกสาร (Document Tracking)
--    16 คอลัมน์ — บันทึกวันที่ตามเอกสารแต่ละรอบ
-- ----------------------------------------------------------------
CREATE TABLE document_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- ตามงาน (ส.ค. 68)
  track_13_8_68   DATE,
  track_14_8_68   DATE,
  track_15_8_68   DATE,
  track_18_8_68   DATE,
  track_19_8_68   DATE,

  -- ตามงาน (ก.ย. 68)
  track_16_9_68   DATE,
  track_17_9_68   DATE,
  track_18_9_68   DATE,
  track_22_9_68   DATE,

  -- ตาม (ต.ค. 68)
  track_14_10_68  DATE,
  track_17_10_68  DATE,
  track_20_10_68  DATE,

  -- ตาม (พ.ย. 68)
  track_17_11_68  DATE,

  -- ตาม (ธ.ค. 68)
  track_9_12_68   DATE,
  track_12_12_68  DATE,

  -- ตาม (ม.ค. 69)
  track_16_1_69   DATE,
  track_20_1_69   DATE,

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (customer_id)
);

-- ----------------------------------------------------------------
-- 5. ค่าบริการ / การเงิน (Service Fees & Finance)
-- ----------------------------------------------------------------
CREATE TABLE service_fees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID REFERENCES customers(id) ON DELETE CASCADE,
  fee_year         INT  NOT NULL,
  fee_month        INT  NOT NULL CHECK (fee_month BETWEEN 1 AND 12),

  -- ค่าบริการหลัก
  accounting_fee   NUMERIC(15,2) DEFAULT 0,   -- ค่าทำบัญชี
  pp30_fee         NUMERIC(15,2) DEFAULT 0,   -- ยื่นแบบ ภ.พ.30
  sps_fee          NUMERIC(15,2) DEFAULT 0,   -- ตามเอกสาร สปส
  social_ins_fee   NUMERIC(15,2) DEFAULT 0,   -- ยื่นแบบประกันสังคม
  pack_fee         NUMERIC(15,2) DEFAULT 0,   -- แพ็คเอกสาร
  other_fee        NUMERIC(15,2) DEFAULT 0,   -- อื่นๆ

  -- ค่าใช้จ่ายอื่น
  labor_cost       NUMERIC(15,2) DEFAULT 0,   -- ค่าแรง
  expense_cost     NUMERIC(15,2) DEFAULT 0,   -- ค่าใช้จ่าย
  inventory        NUMERIC(15,2) DEFAULT 0,   -- สต็อกสินค้า

  -- รวม
  total_fee        NUMERIC(15,2) GENERATED ALWAYS AS (
    accounting_fee + pp30_fee + sps_fee + social_ins_fee +
    pack_fee + other_fee + labor_cost + expense_cost
  ) STORED,

  paid_date        DATE,
  paid_amount      NUMERIC(15,2) DEFAULT 0,
  balance          NUMERIC(15,2) DEFAULT 0,

  remark           TEXT,         -- หมายเหตุ
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE (customer_id, fee_year, fee_month)
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_customers_code   ON customers(customer_code);
CREATE INDEX idx_customers_type   ON customers(customer_type);
CREATE INDEX idx_wht_customer     ON withholding_tax(customer_id);
CREATE INDEX idx_wht_period       ON withholding_tax(tax_year, tax_month);
CREATE INDEX idx_vat_customer     ON vat_pp30(customer_id);
CREATE INDEX idx_vat_period       ON vat_pp30(period_year, period_month);
CREATE INDEX idx_tracking_cust    ON document_tracking(customer_id);
CREATE INDEX idx_fees_customer    ON service_fees(customer_id);
CREATE INDEX idx_fees_period      ON service_fees(fee_year, fee_month);

-- ================================================================
-- UPDATED_AT TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_wht_updated
  BEFORE UPDATE ON withholding_tax
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vat_updated
  BEFORE UPDATE ON vat_pp30
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tracking_updated
  BEFORE UPDATE ON document_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_fees_updated
  BEFORE UPDATE ON service_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) — Enable ใน Supabase
-- ================================================================
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE withholding_tax   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_pp30          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_fees      ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users เข้าถึงได้ทั้งหมด (ปรับตามสิทธิ์ได้ภายหลัง)
CREATE POLICY "auth_all_customers"         ON customers         FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_wht"               ON withholding_tax   FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_vat"               ON vat_pp30          FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_tracking"          ON document_tracking FOR ALL TO authenticated USING (true);
CREATE POLICY "auth_all_fees"              ON service_fees      FOR ALL TO authenticated USING (true);

-- ================================================================
-- SAMPLE DATA
-- ================================================================
INSERT INTO customers (customer_code, tax_id, name, customer_type)
VALUES
  ('SM-103', 'U9d74fbd821162403db26e822315064b5', 'นายจีรศักดิ์ ขัยเจริญศิลป์(ร้านมิตรสากลค้าวัสดุ)', 'ลูกค้า'),
  ('SM-104', '0105566012345',                     'บริษัท ตัวอย่าง จำกัด',                              'บริษัท'),
  ('SM-105', '0633566054321',                     'ห้างหุ้นส่วนจำกัด ทดสอบ',                           'หจก');
