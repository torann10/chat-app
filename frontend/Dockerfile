FROM node:24-alpine AS build

RUN apk add --no-cache openssl

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build --workspace=frontend

FROM nginx:alpine
COPY --from=build /app/frontend/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]