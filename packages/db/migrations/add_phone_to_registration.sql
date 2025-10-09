-- Migration: Add phone fields to Registration table
-- Date: 2025-10-09
-- Description: Adds optional phone and phoneVerified fields to Registration model

-- Add phone column (optional, E.164 format)
ALTER TABLE "Registration" 
ADD COLUMN "phone" TEXT;

-- Add phoneVerified column (default false)
ALTER TABLE "Registration" 
ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN "Registration"."phone" IS 'Phone number in E.164 format (e.g., +525512345678)';
COMMENT ON COLUMN "Registration"."phoneVerified" IS 'Whether the phone number has been verified via SMS/WhatsApp';
