# Node.js 베이스 이미지
FROM node:18

# 앱 디렉터리 생성
WORKDIR /app

# package.json 복사 후 의존성 설치
COPY package*.json ./
RUN npm install

# 나머지 코드 복사
COPY . .

# 포트 열기
EXPOSE 5000

# 서버 실행
CMD ["node", "server.js"]