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
  machine_type = "e2-micro" # Nível gratuito do GCP
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 10
    }
  }

  network_interface {
    network = "default"
    access_config {
      # Deixar vazio para atribuir um IP Externo Efêmero
    }
  }

  # Script de Inicialização (O Cérebro da Automação)
  metadata_startup_script = <<-EOT
    #!/bin/bash
    # Redireciona toda a saída para um log para debug futuro
    exec > /var/log/bot-startup.log 2>&1
    echo "--- INICIANDO PROVISIONAMENTO AUTOMATIZADO ---"

    # 1. Atualização do Sistema e Dependências Base
    apt-get update -y
    apt-get install -y git curl

    # 2. Instalação do Node.js 20 e PM2 (Global)
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        npm install -y -g pm2
    fi

    # 3. Preparação do Diretório e Código
    mkdir -p /opt/bot-whatsapp
    cd /opt/bot-whatsapp

    if [ ! -d ".git" ]; then
      echo "Clonando repositório..."
      git clone https://github.com/allstack-staff/bot-whatsapp.git .
    else
      echo "Atualizando repositório..."
      git pull origin main
    fi

    # 4. Instalação de Dependências e Build do Projeto
    echo "Instalando pacotes npm..."
    npm install

    echo "Limpando pasta dist e compilando TypeScript..."
    rm -rf dist
    # Compilação segura focada na pasta src
    ./node_modules/.bin/tsc --rootDir src --outDir dist

    echo "Copiando arquivos estáticos (JSON)..."
    # Procura todos os JSONs na src e replica na dist com as pastas corretas
    cd src && find . -name "*.json" -exec cp --parents {} ../dist/ \; && cd ..

    # 5. Configuração e Inicialização com PM2
    echo "Configurando processo no PM2..."
    pm2 delete bot-whatsapp || true
    pm2 start npm --name "bot-whatsapp" -- run start
    
    # Salva para persistir após reboots da VM
    pm2 save
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

    echo "--- PROVISIONAMENTO CONCLUÍDO COM SUCESSO ---"
  EOT

  tags = ["bot-whatsapp"]
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