-- Storage bucket `media` was originally created without `video/quicktime`
-- (iPhone .mov) in its allowed_mime_types, so the client's file picker
-- accepts the file (validateFile lets it through) but the storage API
-- rejects the upload. Also adding image/gif for consistency with the
-- HTML file input's `accept` attribute.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]
where id = 'media';
