FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3456
ENV NODE_ENV=production PORT=3456
CMD ["node", "src/server.js"]
