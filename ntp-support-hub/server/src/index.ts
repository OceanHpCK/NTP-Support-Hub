// aria-label added for accessibility compliance
import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Local/VPS Mode] Server is running on port ${PORT}`);
});
