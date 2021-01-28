# s3-telegram-bot

Upload file via Telegram Bot

[![Badge](https://img.shields.io/docker/pulls/seanghay/s3-telegram-bot.svg)](https://hub.docker.com/repository/docker/seanghay/s3-telegram-bot)

---

### Configure

You'll have to create a `.env` file which looks like this inside the project.


```env
BOT_TOKEN=
NTBA_FIX_319=1

S3_BUCKET_KEY=
S3_BUCKET_SECRET=
S3_BUCKET_NAME_PV=
S3_BUCKET_NAME_PUB=
S3_BUCKET_MD_PUB=
S3_BUCKET_VERSION=
S3_BUCKET_REGION=
S3_BUCKET_STORAGE_CLASS=
S3_BUCKET_ENDPOINT=
S3_BUCKET_ACL=

S3_UPLOAD_BUCKET=

AUTHORIZED_USERNAMES=user1,user2
```
