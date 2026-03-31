terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket  = "all-stack-bot-tfstate"
    prefix  = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = "us-central1"
}

variable "project_id" { type = string }
variable "gh_token" { 
  description = "GitHub PAT Token"
  type        = string 
  sensitive   = true
}

# --- INFRA DA VM (O BOT) ---
resource "google_compute_instance" "baileys_bot_vm" {
  name         = "baileys-bot-server"
  machine_type = "e2-micro"
  zone         = "us-central1-a"
  tags         = ["bot-whatsapp"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

metadata_startup_script = <<-EOT
    #!/bin/bash
    # 1. Cria um log detalhado de tudo que acontece no boot
    exec > /var/log/bot-startup.log 2>&1
    echo "Iniciando provisionamento automatizado..."

    # 2. Atualiza e instala pacotes base
    apt-get update
    apt-get install -y git curl

    # 3. Instala Node.js 20 e PM2
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -y -g pm2

    # 4. Prepara o diretório da aplicação
    mkdir -p /opt/bot-whatsapp
    cd /opt/bot-whatsapp

    # 5. Clona o repositório (ou atualiza se a VM for reiniciada)
    if [ ! -d ".git" ]; then
      echo "Clonando o repositório..."
      git clone https://github.com/allstack-staff/bot-whatsapp.git .
    else
      echo "Repositório já existe, atualizando..."
      git pull origin main
    fi

    # 6. Instala dependências
    echo "Instalando pacotes npm..."
    npm install

    # 7. Limpa processos antigos e inicia o novo
    pm2 delete bot-whatsapp || true
    echo "Iniciando o PM2..."
    pm2 start npm --name "bot-whatsapp" -- run start

    # 8. Salva o estado para inicialização com o sistema
    pm2 save
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

    echo "Provisionamento concluído com sucesso!"
  EOT
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh-bot"
  network = "default"
  
  allow { 
    protocol = "tcp"
    ports    = ["22"] 
  }
  
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["bot-whatsapp"]
}

# --- INFRA DA CLOUD FUNCTION (O GATILHO) ---

# Bucket para o código da função
resource "google_storage_bucket" "function_bucket" {
  name     = "${var.project_id}-function-source"
  location = "US"
  storage_class = "STANDARD"
}

# Zip do código (O terraform vai zipar a pasta trigger-function pra você)
data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "${path.module}/trigger-function"
  output_path = "${path.module}/function.zip"
}

resource "google_storage_bucket_object" "function_code" {
  name   = "function-${data.archive_file.function_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.function_zip.output_path
}

resource "google_cloudfunctions_function" "deploy_trigger" {
  name        = "trigger-deploy-bot"
  description = "Dispara o GitHub Actions"
  runtime     = "nodejs20"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.function_code.name
  trigger_http          = true
  entry_point           = "triggerGithubAction"

  environment_variables = {
    GH_TOKEN = var.gh_token
  }
}

# Permite que a função seja chamada via HTTP publicamente
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.deploy_trigger.project
  region         = google_cloudfunctions_function.deploy_trigger.region
  cloud_function = google_cloudfunctions_function.deploy_trigger.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

output "trigger_url" {
  value = google_cloudfunctions_function.deploy_trigger.https_trigger_url
}