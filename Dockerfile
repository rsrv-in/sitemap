FROM node:20-alpine

RUN apk add --no-cache nginx curl bash tzdata busybox-suid \
    && apk add --no-cache --virtual .build-deps make gcc g++ python3 \
    && npm install -g npm@latest \
    && mkdir -p /run/nginx /sitemaps /var/log/cron

ENV TZ=UTC
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cron job: run daily at midnight
RUN echo "0 4 * * * node /app/src/main.js >> /var/log/sitemap-cron.log 2>&1" > /etc/crontabs/root

# Link /sitemaps to Nginx web root
RUN mkdir -p /usr/share/nginx/html/sitemaps && ln -s /sitemaps /usr/share/nginx/html/sitemaps

EXPOSE 80

CMD node /app/src/main.js && crond && nginx -g "daemon off;"
