terraform {
  backend "s3" {
    bucket = "dukat-terraform-state-staging"
    key    = "state.tfstate"
    region = "us-west-2"
  }
}