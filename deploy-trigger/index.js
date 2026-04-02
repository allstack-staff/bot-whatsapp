const compute = require('@google-cloud/compute');
const instancesClient = new compute.v1.InstancesClient();

exports.triggerGithubAction = async (req, res) => {
  const project = process.env.GCP_PROJECT || 'all-stack-commnity';
  const zone = 'us-central1-a';
  const instance = 'baileys-bot-server';

  const script = `
    cd /opt/bot-whatsapp && \
    sudo git fetch --all && \
    sudo git reset --hard origin/main && \
    sudo npm install && \
    sudo rm -rf dist && \
    sudo ./node_modules/.bin/tsc --rootDir src --outDir dist && \
    cd src && sudo find . \\( -name "*.json" -o -name "*.txt" \\) -exec cp --parents {} ../dist/ \\; && cd .. && \
    sudo chmod -R 777 /opt/bot-whatsapp/dist && \
    sudo pm2 restart bot-whatsapp
  `;

  try {
    console.log(`Enviando comando de deploy para ${instance}...`);
    
    await instancesClient.insertCmd({
      project,
      zone,
      instance,
      runCommandRequestResource: {
        command: 'sh',
        args: ['-c', script]
      }
    });

    // Se chegar aqui, retornamos sucesso!
    res.status(200).send({ status: "Comando enviado com sucesso!" });
  } catch (err) {
    console.error("Erro ao disparar comando na VM:", err);
    res.status(500).send({ error: err.message });
  }
};

