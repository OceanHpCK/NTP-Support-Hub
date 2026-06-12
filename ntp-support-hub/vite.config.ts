import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-technical-documents',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/documents/')) {
              try {
                const decodedUrl = decodeURIComponent(req.url);
                const urlPath = decodedUrl.split('?')[0].split('#')[0];
                const relativePath = urlPath.replace(/^\/documents\//, '');
                const rootDir = path.resolve(__dirname, 'document_technical');
                const filePath = path.resolve(rootDir, relativePath);

                // Chặn path traversal (../) thoát khỏi thư mục tài liệu
                if (!filePath.startsWith(rootDir + path.sep)) {
                  res.statusCode = 403;
                  res.end('Forbidden');
                  return;
                }

                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                  res.setHeader('Content-Type', 'application/pdf');
                  fs.createReadStream(filePath).pipe(res);
                  return;
                }
              } catch (err) {
                console.error('Lỗi khi serve tài liệu cục bộ:', err);
              }
            }
            next();
          });
        }
      }
    ],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
