-- MANUAL ROLLBACK ONLY. Export enquiries first; this permanently removes submitted messages.
DROP TABLE IF EXISTS "FormSubmission";
DROP TYPE IF EXISTS "FormSubmissionStatus";
