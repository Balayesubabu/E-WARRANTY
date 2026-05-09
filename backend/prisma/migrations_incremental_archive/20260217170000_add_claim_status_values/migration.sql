-- Add new values to WarrantyClaimStatus enum
ALTER TYPE "WarrantyClaimStatus" ADD VALUE IF NOT EXISTS 'UnderReview';
ALTER TYPE "WarrantyClaimStatus" ADD VALUE IF NOT EXISTS 'AssignedToServiceCenter';
ALTER TYPE "WarrantyClaimStatus" ADD VALUE IF NOT EXISTS 'SLABreached';
