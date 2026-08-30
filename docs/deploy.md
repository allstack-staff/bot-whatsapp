---
title: Deploy (CI/CD)
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>


# Deploy (CI/CD)

## Visão geral

O pipeline (`.github/workflows/deploy.yml`) roda a cada push na branch `main`:

1. **GitHub Actions** faz checkout e autentica no GCP.
2. **Terraform** (`init` → `plan` → `apply`) aplica a infraestrutura.
3. Um **Cloud Function** trigger é acionado via HTTP (com token de identidade OIDC do GitHub).
4. Essa função reinicia a VM `baileys-bot-server` (GCP Compute Engine).
5. Ao reiniciar, o `metadata_startup_script` da VM faz `git pull` e sobe o bot de novo via PM2.

## Correções de robustez já aplicadas

- **`curl --fail-with-body`** no disparo do trigger — antes, um HTTP 500 da própria Cloud Function (que ela retorna quando falha ao reiniciar a VM) passava como sucesso no pipeline, porque `curl` sem essa flag só falha em erro de rede/DNS, não em resposta HTTP de erro.
- **Guarda de variáveis vazias** — se `terraform output -raw trigger_url` ou `gcloud auth print-identity-token` vierem vazios, o pipeline falha explicitamente com uma mensagem clara, em vez de tentar continuar com uma URL/token inválido.
- **`concurrency` group** — impede dois `terraform apply` rodando ao mesmo tempo sobre o mesmo state (um risco real se dois pushes em `main` acontecerem próximos).

## Pendência conhecida — sem arquivos Terraform versionados

**Não existe nenhum arquivo `.tf` neste repositório** (conferido na branch atual e na antiga). O pipeline roda `terraform init/plan/apply` e depois lê um output (`trigger_url`) que não está definido em lugar nenhum do código versionado. A infra (VM, Cloud Function) provavelmente foi criada direto no console do GCP, ou os `.tf` existem em outro lugar não sincronizado com este repo.

Isso significa, na prática:
- Sem um backend de state remoto (ex: bucket do GCS) configurado nos `.tf`, cada execução do pipeline partiria de um state local vazio — sem saber que a VM já existe.
- O pipeline, do jeito que está versionado hoje, não é reproduzível do zero.

**Antes de depender desse pipeline pra deploys de verdade**, vale confirmar com quem criou a infra original (GCP) onde os `.tf` estão, e versioná-los junto com o backend de state remoto. Até lá, trate esse workflow como semi-funcional — as correções de robustez acima garantem que ele *falhe visivelmente* quando algo der errado, mas não resolvem a ausência da infraestrutura como código.

## Número do bot é independente do deploy

Trocar o número do WhatsApp usado pelo bot (perda, ban, etc.) não tem relação com esse pipeline — é uma operação local na VM (trocar a pasta `auth/` e re-escanear o QR). Veja [Troca de Número](troca-de-numero.md).
