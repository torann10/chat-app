FROM node:24-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=backend"]