resource "aws_rds_instance" "db" {
  engine = "postgres"
  instance_class = var.instance_class
  allocated_storage = 20
  db_name = "dukatdb"
  username = var.username
  password = var.password
}