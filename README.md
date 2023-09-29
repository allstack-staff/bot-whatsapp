# All Stack Bot

Um bot de whatsapp que combina serviços administrativos e ChatGPT!

tipos de comando:
 - $asb : Responde com uma mensagem generica
 - $asb::comando : comando acessivel apenas pra admins (veja a sessão comandos para vê-los)
 - $asb:comando : comando acessivel pra todos.

## Instalando

para instalar, clone esse repositorio, e instale as dependencias com o comando `yarn`.

## Executando

para compilar, use `yarn build`, e depois execute com `yarn start`. Para testes, use `yarn dev`.

## Configurando

Para configurar o projeto, siga os seguintes passos:


1. Crie um arquivo `.env` no diretorio raiz do projeto, contendo uma chave da OpenAI:
    ```
    API_KEY=SUA CHAVE DA OPENAI
    ```

2. Após iniciar o projeto, leia o qrcode que vai aparecer no terminal com o seu whatsapp.


Outras seções:
  1. [Comandos](./comandos.md)


