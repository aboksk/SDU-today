CREATE TYPE "EventPaymentStatus" AS ENUM ('NOT_REQUIRED', 'SIMULATED_PAID');

ALTER TABLE "EventRegistration"
ADD COLUMN "paymentStatus" "EventPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';
