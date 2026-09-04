CREATE POLICY "withdrawal_proofs_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'withdrawal-proofs' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "withdrawal_proofs_admin_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'withdrawal-proofs' AND public.has_role(auth.uid(),'admin'));