variable "instance_class" { default = "db.t3.micro" }
variable "username" { type = string }
variable "password" { type = string; sensitive = true }