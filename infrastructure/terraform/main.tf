module "networking" {
  source      = "./modules/networking"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

module "iam" {
  source = "./modules/iam"
}

module "kubernetes" {
  source      = "./modules/kubernetes"
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnets
  iam_roles   = module.iam.eks_roles
  gpu_min     = var.gpu_node_min
  gpu_max     = var.gpu_node_max
  depends_on  = [module.iam]
}

module "database" {
  source     = "./modules/database"
  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.private_subnets
  depends_on = [module.kubernetes]
}

module "monitoring" {
  source       = "./modules/monitoring"
  cluster_name = module.kubernetes.cluster_name
  depends_on   = [module.kubernetes]
}

module "secrets" {
  source     = "./modules/secrets"
  depends_on = [module.kubernetes]
}

module "sbc" {
  source     = "./modules/sbc"
  depends_on = [module.networking, module.kubernetes]
}

module "telephony" {
  source     = "./modules/telephony"
  depends_on = [module.sbc]
}

module "edge-compute" {
  source     = "./modules/edge-compute"
  depends_on = [module.networking]
}