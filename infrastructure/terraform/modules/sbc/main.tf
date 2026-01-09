resource "aws_ec2_instance" "sbc" {
  ami = "ami-kamailio"
  instance_type = "t3.medium"
}