const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const sharp = require("sharp");
const _ = require("lodash");
const slugify = require("slugify");
const AWS = require("aws-sdk");
const cuid = require('cuid');

dotenv.config();

const s3 = new AWS.S3({
  apiVersion: process.env.S3_BUCKET_REGION,
  region: process.env.S3_BUCKET_REGION,
  accessKeyId: process.env.S3_BUCKET_KEY,
  secretAccessKey: process.env.S3_BUCKET_SECRET,
});

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/check/, (msg, match) => {
  if (isAuthorized(msg)) {
    bot.sendMessage(msg.chat.id, "Yes! ✅");
    return;
  }
  bot.sendMessage(msg.chat.id, "No! 🚫");
});


bot.on("message", async (msg) => {

  if (msg.document) {    
    if (!isAuthorized(msg)) {
      bot.sendMessage(msg.chat.id, "Unauthorized!");
      return;
    } 

    if (!msg.document.mime_type.startsWith("image/")) {
      bot.sendMessage(msg.chat.id, "Unsupported file type. Try again!");
      return;
    }

    if (msg.document.file_size >= MAX_FILE_SIZE) {
      bot.sendMessage(
        msg.chat.id,
        "File size is too large. Try file that is smaller than 1MB!"
      );
      return;
    }

    const filePath = path.parse(msg.document.file_name);
    const extension = filePath.ext;
    const filename = slugify(filePath.name);

    let newFilename = filename;
    if (!newFilename) {
      newFilename = cuid();
    }

    newFilename += '-tg';
    if (extension) {
      newFilename += extension;
    }

    bot.sendMessage(msg.chat.id, "Uploading your file...");

    const fileStream = bot.getFileStream(msg.document.file_id);
    const bufs = [];

    fileStream.on("data", function (d) {
      bufs.push(d);
    });

    fileStream.on("error", async (error) => {
      console.error(error);
      await bot.sendMessage(
        msg.chat.id,
        "I cannot upload your file because I don't know what happened"
      );
    });

    fileStream.on("end", async function () {
      const buffer = Buffer.concat(bufs);
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 512, fit: "contain", withoutEnlargement: true })
        .png({ quality: 80 })
        .toBuffer();

      const fileUrl = await uploadBuffer(compressedBuffer, newFilename, msg.document.mime_type);
      await bot.sendMessage(msg.chat.id, `\`${fileUrl}\``, { parse_mode: 'Markdown' });
    });
    return;
  }
  if (msg.photo) {
    bot.sendMessage(
      msg.chat.id,
      "You must upload your photo as uncompressed file."
    );
  }
});

async function uploadBuffer(buffer, filename, mimeType) {

  const baseUrl = `https://${process.env.S3_BUCKET_NAME_PUB}.${process.env.S3_BUCKET_ENDPOINT}/`;
  const directory = process.env.S3_UPLOAD_BUCKET;
  const bucket = process.env.S3_BUCKET_NAME_PUB;

  const info = {
    Bucket: bucket,
    ACL: "public-read",
    ContentType: mimeType,
    Body: buffer,
    Key: directory + filename,
  };

  await s3.putObject(info).promise();
  return baseUrl + directory + filename;
}

function isAuthorized(msg) {
  if (!msg.chat) {
    return false;
  }

  const username = msg.chat.username;
  if (!username) {
    return false;
  }

  if (!process.env.AUTHORIZED_USERNAMES) {
    return false;
  }

  const authUsers = process.env.AUTHORIZED_USERNAMES.split(',').map(it => it.trim());
  return authUsers.includes(username);
}