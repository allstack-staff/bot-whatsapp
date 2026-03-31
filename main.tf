terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "us-central1"
  zone    = "us-central1-a"
}

variable "project_id" {
  description = "ID do projeto no GCP (injetado pelo GitHub Actions)"
  type        = string
}

# Cria a Máquina Virtual (Sempre Gratuita)
resource "google_compute_instance" "baileys_bot_vm" {
  name         = "baileys-bot-server"
  machine_type = "e2-micro"
  zone         = "us-central1-a"

  tags = ["bot-whatsapp"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      type  = "pd-standard"
      size  = 30
    }
  }

  network_interface {
    network = "default"
    access_config {} # Garante um IP público
  }

  # Script de inicialização: Prepara o ambiente automaticamente
  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update
    apt-get upgrade -y
    
    # Instala Git e Curl
    apt-get install -y git curl
    
    # Instala Node.js (Versão 20 LTS)
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Instala PM2 globalmente
    npm install -y -g pm2
  EOT
}

# Regra de Firewall para permitir acesso SSH
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