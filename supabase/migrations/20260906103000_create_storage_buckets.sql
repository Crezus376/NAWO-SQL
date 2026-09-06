-- Les politiques d'accès aux images existent déjà, mais les buckets doivent
-- également être présents dans storage.buckets avant tout upload.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-images', 'event-images', true),
  ('ticket-images', 'ticket-images', true),
  ('withdrawal-proofs', 'withdrawal-proofs', false)
ON CONFLICT (id) DO NOTHING;
