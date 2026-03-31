terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Configuração do State Remoto no Bucket criado
  backend "gcs" {
    bucket  = "all-stack-bot-tfstate"
    prefix  = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = "us-central1"
  zone    = "us-central1-a"
}

variable "project_id" {
  description = "ID do projeto no GCP"
  type        = string
}

# VM e2-micro (Sempre Gratuita)
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
    access_config {} # IP Público Efêmero
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update
    apt-get upgrade -y
    apt-get install -y git curl
    
    # Node.js 20 LTS e PM2
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    npm install -y -g pm2
  EOT
}

# Firewall para SSH
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