import express from 'express';
import cors from 'cors';
import { router } from './router.js';
import { initScheduler } from './scheduler.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

// Initialize scheduler for timed broadcasts
initScheduler();

app.listen(PORT, () => {
  console.log(`Claudio DJ server running on port ${PORT}`);
});

export default app;