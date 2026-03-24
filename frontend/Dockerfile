FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# --- Production ---
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# SPA fallback: redirect all routes to index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location /api/ { \
        proxy_pass http://backend:8001/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        client_max_body_size 50M; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
