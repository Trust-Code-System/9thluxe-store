CREATE UNIQUE INDEX "PasswordResetToken_userId_key"
ON "PasswordResetToken"("userId");

DROP INDEX "PasswordResetToken_userId_expiresAt_idx";
