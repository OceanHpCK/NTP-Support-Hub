FROM node:22-alpine

WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép schema Prisma và generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Sao chép toàn bộ source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 5000

# Khởi chạy migration tạo bảng và sau đó bật server
CMD ["sh", "-c", "npx prisma db push && npm start"]
