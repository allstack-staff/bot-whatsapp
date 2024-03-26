// Configuracao de ambiente para inicio do pm2 com o nodejs + docker

module.exports = {
  apps: [
    {
      name: "bot-v3",
      script: "./dist/main.js",
      watch: true,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        OPENAI_API_KEY:
          import.meta.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        OPENAI_API_KEY:
          import.meta.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        PORT: 3001,
      },
    },
  ],
};
