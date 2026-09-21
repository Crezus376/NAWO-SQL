FROM php:8.4-fpm-alpine

RUN docker-php-ext-install pdo_mysql
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts
COPY . .
RUN composer run-script post-autoload-dump && mkdir -p storage/framework/{cache,sessions,views} storage/logs && chown -R www-data:www-data storage bootstrap/cache

USER www-data
CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]
