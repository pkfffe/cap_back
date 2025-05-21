FROM node:18

WORKDIR /app

# ✅ 여기 수정: netcat → netcat-openbsd
RUN apt-get update && apt-get install -y netcat-openbsd

COPY package*.json ./
RUN npm install

COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

COPY . .

EXPOSE 5000

CMD ["./wait-for-it.sh", "db:3306", "--", "node", "server.js"]
