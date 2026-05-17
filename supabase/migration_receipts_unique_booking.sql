-- Enforce one receipt per booking. The webhook now skips the SELECT-then-INSERT
-- two-step and relies on this constraint (23505 = duplicate) to noop on retries.

alter table receipts
  add constraint receipts_booking_id_unique unique (booking_id);
