resource "aws_acm_certificate" "cert" {
  domain_name = "*.dukat.io"
  validation_method = "DNS"
}