terraform {
  backend "s3" {
    bucket = "dukat-terraform-state-dev"
    key    = "state.tfstate"
    region = "us-east-2"
  }
}