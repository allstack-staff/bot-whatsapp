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

# --- VARIÁVEIS ---
variable "project_id" { type = string }
variable "gh_token" { 
  description = "GitHub PAT Token"
  type        = string 
  sensitive   = true
}

# Coleta os dados da Service Account do GitHub
data "google_service_account" "gh_actions" {
  account_id = "github-actions" 
}

# --- INFRA DA VM (O BOT E OBSERVABILIDADE PM2.IO) ---
resource "google_compute_instance" "baileys_bot_vm" {
  name         = "baileys-bot-server"
  machine_type = "e2-micro"
  zone         = "us-central1-c"
  tags         = ["bot-whatsapp"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 10
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    exec > /var/log/bot-startup.log 2>&1
    export HOME=/root
    export PATH=$PATH:/usr/bin:/usr/local/bin
    echo "--- INICIANDO PROVISIONAMENTO ---"

    apt-get update -y
    apt-get install -y git curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -y -g pm2

    mkdir -p /opt/bot-whatsapp
    cd /opt/bot-whatsapp
    if [ ! -d ".git" ]; then
      git clone https://github.com/allstack-staff/bot-whatsapp.git .
    else
      git fetch --all
      git reset --hard origin/main
    fi

    npm install
    rm -rf dist
    ./node_modules/.bin/tsc --rootDir src --outDir dist

    echo "Sincronizando JSONs e TXTs..."
    cd src && find . \( -name "*.json" -o -name "*.txt" \) -exec cp --parents {} ../dist/ \; && cd ..
    chmod -R 777 /opt/bot-whatsapp/dist

    PM2_PATH=$(command -v pm2)
    
    # 1. Limpa e Inicia o Bot do WhatsApp
    $PM2_PATH delete bot-whatsapp || true
    $PM2_PATH start npm --name "bot-whatsapp" -- run start
    
    # 2. Conecta a VM ao painel na nuvem do PM2.io (Chaves da Imagem)
    $PM2_PATH link 4plk48ypl2w27tt lez5w319nxogm92
    
    # 3. Salva os processos para iniciarem junto com a máquina
    $PM2_PATH save
    $PM2_PATH startup systemd -u root --hp /root --force

    echo "--- PROVISIONAMENTO CONCLUÍDO ---"
  EOT
}

resource "google_project_iam_member" "sa_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${data.google_service_account.gh_actions.email}"
}

# --- FIREWALL (Voltamos apenas para o SSH seguro) ---
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

# --- INFRA DA CLOUD FUNCTION ---

resource "google_storage_bucket" "function_bucket" {
  name          = "${var.project_id}-function-source"
  location      = "US"
  storage_class = "STANDARD"
  force_destroy = true 
}

data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "${path.module}/trigger-function"
  output_path = "${path.module}/function.zip"
}

resource "google_storage_bucket_object" "function_code" {
  name   = "function-v3-${data.archive_file.function_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.function_zip.output_path
}

resource "google_cloudfunctions_function" "deploy_trigger" {
  name        = "trigger-deploy-bot"
  description = "Dispara o deploy via GitHub Actions v3"
  runtime     = "nodejs20"
  region      = "us-central1"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.function_code.name
  trigger_http          = true
  entry_point           = "triggerGithubAction"

  environment_variables = {
    GH_TOKEN = var.gh_token
  }
}

# --- SEGURANÇA (IAM) ---

resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.deploy_trigger.project
  region         = google_cloudfunctions_function.deploy_trigger.region
  cloud_function = google_cloudfunctions_function.deploy_trigger.name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${data.google_service_account.gh_actions.email}"
}

output "trigger_url" {
  value = google_cloudfunctions_function.deploy_trigger.https_trigger_url
}