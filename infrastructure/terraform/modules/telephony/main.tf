resource "aws_chime_voice_connector" "telephony" {
  name = var.name
  require_encryption = true
}