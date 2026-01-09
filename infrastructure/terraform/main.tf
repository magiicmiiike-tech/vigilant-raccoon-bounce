# Main Terraform configuration for Dukat Voice SaaS

provider "aws" {
  region = var.aws_region
}

# Networking
module "vpc" {
  source = "./modules/networking"
  # ...
}

# EKS Cluster
module "eks" {
  source = "./modules/compute"
  # ...
}

# RDS Instances
module "rds" {
  source = "./modules/database"
  # ...
}
