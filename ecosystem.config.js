module.exports = {
  apps : [{
    name: "s3-telegram-bot",
    script: "./main.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}