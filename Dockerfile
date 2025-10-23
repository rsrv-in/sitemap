FROM node:20-alpine

# Install cron, http-server, and build deps
RUN apk add --no-cache curl bash tzdata busybox-suid \
    && apk add --no-cache --virtual .build-deps make gcc g++ python3 \
    && npm install -g npm@latest http-server

ENV TZ=UTC
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY src ./src

# Create /sitemaps directory
RUN mkdir -p /sitemaps /var/log/cron

# Cron job: run every hour
RUN echo "0 * * * * node /app/src/main.js >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

# Expose port
EXPOSE 80

# Run initial sitemap generation, start cron, then serve /sitemaps
CMD node /app/src/main.js && crond && http-server /sitemaps -p 80 --cors
