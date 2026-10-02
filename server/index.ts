import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSimRouter } from './createApi.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4000);
const app = express();

app.use('/api', createSimRouter());

const dist = path.resolve(__dirname, '../dist');
app.use(express.static(dist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LineGuard engine listening on http://localhost:${PORT}`);
});
