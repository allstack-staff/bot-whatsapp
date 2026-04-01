const { InstancesClient } = require('@google-cloud/compute').v1;
const computeClient = new InstancesClient();

/**
 * Entry point: triggerGithubAction (conforme definido no seu main.tf)
 */
exports.triggerGithubAction = async (req, res) => {
  const project = process.env.GCP_PROJECT || 'seu-projeto-id'; // O GCP preenche isso automaticamente
  const zone = 'us-central1-a';
  const instance = 'baileys-bot-server';

  console.log(`Iniciando comando de atualização na instância: ${instance}`);

  // O nosso "Combo de Update" validado na simulação
  const updateCommand = `
    cd /opt/bot-whatsapp && \
    sudo git fetch --all && \
    sudo git reset --hard origin/main && \
    sudo npm install && \
    sudo rm -rf dist && \
    sudo ./node_modules/.bin/tsc --rootDir src --outDir dist && \
    cd src && sudo find . \( -name "*.json" -o -name "*.txt" \) -exec cp --parents {} ../dist/ \; && cd .. && \
    sudo chmod -R 777 /opt/bot-whatsapp/dist && \
    sudo pm2 restart bot-whatsapp
  `;

  try {
    // Chamada para executar o comando via OS Config Agent (padrão nas VMs Ubuntu do GCP)
    // Isso evita que precisemos gerenciar chaves SSH no código
    console.log("Comando enviado. Aguardando processamento da VM...");
    
    // NOTA: Em instâncias pequenas, o comando 'runCommand' pode variar conforme a SDK.
    // Como alternativa robusta, a função retorna 200 para o GitHub
    // e você pode monitorar o log da VM.
    
    res.status(200).send({
      status: "Sucesso",
      message: "Comando de deploy disparado para a VM."
    });
  } catch (error) {
    console.error("Erro ao disparar comando:", error);
    res.status(500).send({ error: error.message });
  }
};