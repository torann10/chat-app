FROM node:24-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY . .
RUN npm install
RUN npm run prisma
RUN npm prune --omit=dev

FROM node:24-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend ./backend
COPY --from=build /app/shared ./shared
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=backend"]