-- Replaces the seed placeholders from Script0000 with Miro Auto's real details
-- and switches the tax line from the Estonian 20% VAT default to Malaysian
-- Service Tax at 8% (the rate since 1 March 2024).
--
-- Company details transcribed from the workshop's own pre-existing invoices.
-- NOTE: `reg_nr` prints as "SSM:" and `tax_id` prints as "SST:" in the invoice
-- footer. Leave `tax_id` NULL unless an actual SST registration number exists —
-- printing a tax rate without a registration number is a compliance problem.

UPDATE tenant_config.requisites SET
    name          = 'MIRO AUTO',
    phone         = '018-225 7478',
    email         = NULL,                          -- no email on the old invoices
    address       = 'No. 5, Block D, Lot 757, Jalan Subang 3',
    address2      = 'Off Persiaran Subang',
    city          = 'Subang Jaya',
    postcode      = '47500',
    state         = 'Selangor',
    country       = 'Malaysia',
    bank_account  = 'CIMB 8002599822 (MIRO AUTO)',
    reg_nr        = '000963875K',                  -- SSM company registration
    tax_id        = NULL,                          -- REPLACE with the SST number
    currency      = 'MYR',
    updated_at    = CURRENT_TIMESTAMP
WHERE id = '6dd57256-2774-424f-a61b-887bf8327329';

UPDATE tenant_config.pricing SET
    vat_rate      = 8,                             -- Malaysian Service Tax
    surcharge     = NULL,
    disclaimer    = NULL,
    updated_at    = CURRENT_TIMESTAMP
WHERE id = '3b9806b3-287b-46cc-bc17-a2d40500327b';
