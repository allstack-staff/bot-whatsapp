const https = require('https');

exports.triggerGithubAction = (req, res) => {
  // Verificação simples de segurança (Token estático)
  // Você passará esse token na URL para evitar que qualquer um rode seu deploy
  const authToken = req.query.token;
  if (authToken !== 'rMcQ4J3HV`73') {
    return res.status(403).send('Não autorizado');
  }

  const data = JSON.stringify({ ref: 'main' });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/all-stack-staff/NOME_DO_SEU_REPO/actions/workflows/deploy.yml/dispatches',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GH_TOKEN}`,
      'User-Agent': 'GCP-Cloud-Function',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  };

  const request = https.request(options, (response) => {
    if (response.statusCode === 204) {
      res.status(200).send('🚀 Pipeline disparado com sucesso!');
    } else {
      res.status(response.statusCode).send('❌ Falha ao disparar pipeline');
    }
  });

  request.on('error', (error) => {
    res.status(500).send(error.message);
  });

  request.write(data);
  request.end();
};