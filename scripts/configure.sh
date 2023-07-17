#!/usr/bin/env bash

set -e

if [ -z "${ECR_PREFIX}" ] ; then
  echo "ENV: ECR_PREFIX is missing!"
  exit 1
fi

if [ -z "${APP_NAME}" ] ; then
  echo "ENV: APP_NAME is missing!"
  exit 1
fi

if [ -z "${DISCORD_WEBHOOK_URL}" ] ; then
  echo "ENV: DISCORD_WEBHOOK_URL is missing!"
  exit 1
fi

if [ -z "${DEPLOY_LOGIN}" ] ; then
  echo "ENV: DEPLOY_LOGIN is missing!"
  exit 1
fi

if [ -z "${DEPLOY_HOST}" ] ; then
  echo "ENV: DEPLOY_HOST is missing!"
  exit 1
fi

if [ -z "${DISCORD_API_KEY}" ] ; then
  echo "ENV: DISCORD_API_KEY is missing!"
  exit 1
fi

if [ -z "${DISCORD_CHANNEL_ID}" ] ; then
  echo "ENV: DISCORD_CHANNEL_ID is missing!"
  exit 1
fi

if [ -z "${DB_HOST}" ] ; then
  echo "ENV: DB_HOST is missing!"
  exit 1
fi

if [ -z "${DB_USER}" ] ; then
  echo "ENV: DB_USER is missing!"
  exit 1
fi

if [ -z "${DB_PASS}" ] ; then
  echo "ENV: DB_PASS is missing!"
  exit 1
fi

if [ -z "${DB_NAME}" ] ; then
  echo "ENV: DB_NAME is missing!"
  exit 1
fi

rm -f scripts/build.sh
rm -f scripts/push.sh
rm -f scripts/deploy.sh
rm -f docker-compose.yml

cp docker-compose.yml.dist docker-compose.yml
sed -i "s|xxx.dkr.ecr.eu-central-1.amazonaws.com|${ECR_PREFIX}|" docker-compose.yml
sed -i "s|xxx|${DISCORD_API_KEY}|" docker-compose.yml
sed -i "s|kkk|${DISCORD_CHANNEL_ID}|" docker-compose.yml
sed -i "s|yyy|${DB_HOST}|" docker-compose.yml
sed -i "s|zzz|${DB_USER}|" docker-compose.yml
sed -i "s|aaa|${DB_PASS}|" docker-compose.yml
sed -i "s|ddd|${DB_NAME}|" docker-compose.yml

cp scripts/build.sh.dist scripts/build.sh
sed -i "s|xxx.dkr.ecr.eu-central-1.amazonaws.com|${ECR_PREFIX}|" scripts/build.sh

cp scripts/deploy.sh.dist scripts/deploy.sh
sed -i "s|xxx.dkr.ecr.eu-central-1.amazonaws.com|${ECR_PREFIX}|" scripts/deploy.sh
sed -i "s|app@1.1.1.1|${DEPLOY_LOGIN}|" scripts/deploy.sh
sed -i "s|stuff.prod.google.com|${DEPLOY_HOST}|" scripts/deploy.sh

cp scripts/push.sh.dist scripts/push.sh
sed -i "s|xxx.dkr.ecr.eu-central-1.amazonaws.com|${ECR_PREFIX}|" scripts/push.sh

cp scripts/notification.sh.dist scripts/notification.sh
sed -i "s|<app-name>|${APP_NAME}|" scripts/notification.sh
sed -i "s|<discord-webhoook-url>|${DISCORD_WEBHOOK_URL}|" scripts/notification.sh
