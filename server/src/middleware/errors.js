export function notFound(req, res) {
  res.status(404).json({ error: 'That endpoint does not exist.' });
}
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'This record already exists.' });
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
