-- Add workshop profile fields to requisites
ALTER TABLE tenant_config.requisites
    ADD COLUMN IF NOT EXISTS tagline VARCHAR,
    ADD COLUMN IF NOT EXISTS website VARCHAR,
    ADD COLUMN IF NOT EXISTS address2 VARCHAR,
    ADD COLUMN IF NOT EXISTS city VARCHAR,
    ADD COLUMN IF NOT EXISTS postcode VARCHAR,
    ADD COLUMN IF NOT EXISTS state VARCHAR,
    ADD COLUMN IF NOT EXISTS country VARCHAR,
    ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'MYR',
    ADD COLUMN IF NOT EXISTS logo BYTEA,
    ADD COLUMN IF NOT EXISTS logo_content_type VARCHAR;

-- Add invoice template fields to pricing
ALTER TABLE tenant_config.pricing
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS workshop_signature BYTEA,
    ADD COLUMN IF NOT EXISTS invoice_number_prefix VARCHAR DEFAULT 'INV',
    ADD COLUMN IF NOT EXISTS due_days INTEGER DEFAULT 30;
