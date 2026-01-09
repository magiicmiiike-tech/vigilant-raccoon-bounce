resource "aws_ec2_instance" "compute" {
  ami = "ami-0abcdef1234567890"
  instance_type = var.instance_type
}