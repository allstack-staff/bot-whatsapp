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
    exec > /var/log/bot-startup.log 2>&1
    export HOME=/root
    export PATH=$PATH:/usr/bin:/usr/local/bin
    echo "--- INICIANDO PROVISIONAMENTO ---"

    # 1. Instalação básica
    apt-get update -y
    apt-get install -y git curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -y -g pm2

    # 2. Setup do diretório
    mkdir -p /opt/bot-whatsapp
    cd /opt/bot-whatsapp
    if [ ! -d ".git" ]; then
      git clone https://github.com/allstack-staff/bot-whatsapp.git .
    else
      git fetch --all
      git reset --hard origin/main
    fi

    # 3. Build e Assets (Agora com .txt também!)
    npm install
    rm -rf dist
    ./node_modules/.bin/tsc --rootDir src --outDir dist

    echo "Sincronizando JSONs e TXTs..."
    # Esse comando agora pega .json e .txt
    cd src && find . \( -name "*.json" -o -name "*.txt" \) -exec cp --parents {} ../dist/ \; && cd ..
    
    # Ajuste de permissão para o bot conseguir escrever nos arquivos
    chmod -R 777 /opt/bot-whatsapp/dist

    # 4. Inicialização (Usando o caminho dinâmico do PM2)
    PM2_PATH=$(command -v pm2)
    $PM2_PATH delete bot-whatsapp || true
    $PM2_PATH start npm --name "bot-whatsapp" -- run start
    $PM2_PATH save
    $PM2_PATH startup systemd -u root --hp /root --force

    echo "--- PROVISIONAMENTO CONCLUÍDO ---"
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