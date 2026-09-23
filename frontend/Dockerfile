# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci || npm install

# Build production bundle
COPY . .
RUN npm run build

# Production runtime stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy compiled SPA assets and nginx config
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
