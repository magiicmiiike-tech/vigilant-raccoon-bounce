variable "lb_name" { default = "dukat-lb" }
variable "security_groups" { type = list(string) }
variable "subnets" { type = list(string) }