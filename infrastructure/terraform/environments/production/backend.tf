terraform {
  backend "s3" {
    bucket = "dukat-terraform-state-prod"
    key    = "state.tfstate"
    region = "us-east-1"
  }
}