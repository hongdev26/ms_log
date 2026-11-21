-- Merchant Support Issue Logger & Score Dashboard Schema + Seed Data (Supabase Postgres)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Merchants table with generated/indexed right_8_digits of tid_mid
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_name TEXT NOT NULL,
    tid_mid TEXT NOT NULL UNIQUE,
    right_8_digits TEXT GENERATED ALWAYS AS (
        CASE WHEN length(tid_mid) >= 8 THEN right(tid_mid, 8) ELSE tid_mid END
    ) STORED,
    business_service TEXT NOT NULL DEFAULT 'POS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchants_name_lower ON public.merchants (lower(merchant_name));
CREATE INDEX IF NOT EXISTS idx_merchants_right8 ON public.merchants (right_8_digits);
CREATE INDEX IF NOT EXISTS idx_merchants_tid ON public.merchants (tid_mid);

-- 2. Issue Templates table with default score weight
CREATE TABLE IF NOT EXISTS public.issue_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_of_issue TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'Request',
    business_service TEXT NOT NULL DEFAULT 'POS',
    reported_by TEXT NOT NULL DEFAULT 'Merchant Staff',
    score INTEGER NOT NULL DEFAULT 1 CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optional Solutions per Issue Template
CREATE TABLE IF NOT EXISTS public.issue_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.issue_templates(id) ON DELETE CASCADE,
    solution_text TEXT NOT NULL,
    UNIQUE (template_id, solution_text)
);

-- 4. Issue Logs table
CREATE TABLE IF NOT EXISTS public.issue_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    merchant_name TEXT NOT NULL DEFAULT '',
    tid_mid TEXT NOT NULL DEFAULT '',
    business_service TEXT NOT NULL DEFAULT 'POS',
    task_originated TEXT NOT NULL DEFAULT 'Merchants',
    type_of_issue TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Request',
    score INTEGER NOT NULL DEFAULT 1 CHECK (score >= 0 AND score <= 100),
    reported_by TEXT NOT NULL DEFAULT 'Merchant Staff',
    contact_number TEXT NOT NULL DEFAULT '',
    solution TEXT NOT NULL,
    remarks TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Done',
    date_solved DATE,
    supported_by TEXT NOT NULL DEFAULT '',
    mmm_yyyy TEXT NOT NULL DEFAULT '',
    yyyy TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_logs_date ON public.issue_logs (date DESC);
CREATE INDEX IF NOT EXISTS idx_issue_logs_supported_by ON public.issue_logs (supported_by);
CREATE INDEX IF NOT EXISTS idx_issue_logs_category ON public.issue_logs (category);

-- Enable Row Level Security (configure policies per your auth model)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for server-side / authenticated app access (tighten for production auth)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchants' AND policyname = 'Allow all merchants') THEN
        CREATE POLICY "Allow all merchants" ON public.merchants FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'issue_templates' AND policyname = 'Allow all issue_templates') THEN
        CREATE POLICY "Allow all issue_templates" ON public.issue_templates FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'issue_solutions' AND policyname = 'Allow all issue_solutions') THEN
        CREATE POLICY "Allow all issue_solutions" ON public.issue_solutions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'issue_logs' AND policyname = 'Allow all issue_logs') THEN
        CREATE POLICY "Allow all issue_logs" ON public.issue_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- PRE-POPULATE DEFAULT MERCHANTS
-- Edit or append your default merchant rows below before running the migration.
-- ============================================================================
INSERT INTO public.merchants (merchant_name, tid_mid, business_service)
VALUES
    ('SUPER DUPER 4 (PP)', '219020454110063', 'POS'),
    ('BROWN COFFEE BKK1', '219020454889912', 'STATIC QR'),
    ('LUCKY SUPERMARKET TK', '219020454332211', 'POS'),
    ('AMAZON CAFE NORODOM', '219020454776655', 'Soundbox'),
    ('CALTEX BK P1 MAIN', '219020454100101', 'POS'),
    ('CALTEX BK P2 EXPRESS', '219020454100102', 'POS'),
    ('MINI MART TOUL KORK', '219020454554433', 'STATIC QR'),
    ('PAYWAY MERCHANT HUB 01', '219020454998877', 'PAYWAY')
ON CONFLICT (tid_mid) DO UPDATE
SET
    merchant_name = EXCLUDED.merchant_name,
    business_service = EXCLUDED.business_service;

-- ============================================================================
-- PRE-POPULATE DEFAULT ISSUE TEMPLATES & OPTIONAL SOLUTIONS
-- ============================================================================
INSERT INTO public.issue_templates (type_of_issue, category, business_service, reported_by, score)
VALUES
    ('Paper Rolls', 'Request', 'POS', 'Merchant Staff', 1),
    ('ABA Merchant REQUEST CHANGE NAME (REJECT OR APPROVE)', 'Request', 'ABA Merchant App', 'E-mail', 2),
    ('Check Transaction', 'Inquiries', 'STATIC QR', 'Merchant Staff', 1),
    ('Check KHQR payment', 'Inquiries', 'STATIC QR', 'Merchant Staff', 1),
    ('ADD TELEGRAM ALERT', 'Request', 'STATIC QR', 'Merchant Staff', 2),
    ('Dispute case', 'Issues', 'STATIC QR', 'E-mail', 3),
    ('POS CONFIGURATION', 'Issues', 'POS', 'Merchant Support', 3),
    ('TOP UP ISSUE', 'Issues', 'PAYWAY', 'E-mail', 2),
    ('Unsuccessul KHQR payment', 'Issues', 'STATIC QR', 'Merchant Staff', 2),
    ('TRANSACTION REFUND REQUEST', 'Request', 'POS', 'E-mail', 3)
ON CONFLICT (type_of_issue) DO NOTHING;

INSERT INTO public.issue_solutions (template_id, solution_text)
SELECT id, sol
FROM public.issue_templates
CROSS JOIN LATERAL (
    VALUES
        ('Paper Rolls', 'Drop to team for support'),
        ('Paper Rolls', 'Done provided paper rolls and maintenance'),
        ('Paper Rolls', 'Check and drop to team for support'),
        ('ABA Merchant REQUEST CHANGE NAME (REJECT OR APPROVE)', 'Check and verify with MMP'),
        ('Check Transaction', 'Check and inform to merchant accordingly'),
        ('Check KHQR payment', 'Check and inform to merchant accordingly'),
        ('ADD TELEGRAM ALERT', 'Check and process add in MMP'),
        ('Dispute case', 'Check and contact to merchant for checking'),
        ('POS CONFIGURATION', 'Check and process replace new POS'),
        ('POS CONFIGURATION', 'Check and re-configure POS terminal'),
        ('TOP UP ISSUE', 'Check and drop to merchant for processing re-top up'),
        ('Unsuccessul KHQR payment', 'Check and inform to merchant accordingly'),
        ('TRANSACTION REFUND REQUEST', 'prepare refund form and send to merchant for further process')
) AS s(issue_name, sol)
WHERE type_of_issue = s.issue_name
ON CONFLICT (template_id, solution_text) DO NOTHING;
