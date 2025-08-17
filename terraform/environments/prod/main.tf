# Production Environment Configuration
# This file orchestrates all modules to create the complete infrastructure for the production environment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Import shared configuration
locals {
  # Project configuration
  project_name = var.project_name
  owner        = "Obinna Iheanacho"

  # Common tags applied to all resources
  common_tags = {
    Project     = local.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = local.owner
  }

  # Naming conventions
  name_prefix = "${local.project_name}-${var.environment}"

  # Common availability zones pattern
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]

  # Common ports
  ports = {
    http        = 80
    https       = 443
    ssh         = 22
    postgresql  = 5432
    redis       = 6379
    backend_api = 5000
    frontend    = 3000
  }
}

# Networking Module
module "networking" {
  source = "../../modules/networking"

  name_prefix              = local.name_prefix
  vpc_cidr                 = var.vpc_cidr
  public_subnet_cidrs      = var.public_subnet_cidrs
  private_subnet_cidrs     = var.private_subnet_cidrs
  database_subnet_cidrs    = var.database_subnet_cidrs
  enable_nat_gateway       = var.enable_nat_gateway
  enable_flow_logs         = var.enable_flow_logs
  flow_logs_retention_days = var.flow_logs_retention_days
  environment              = var.environment
  common_tags              = local.common_tags
}

# Security Module
module "security" {
  source = "../../modules/security"

  name_prefix             = local.name_prefix
  vpc_id                  = module.networking.vpc_id
  allowed_cidr_blocks     = var.allowed_cidr_blocks
  app_port                = local.ports.frontend
  enable_ssh_access       = var.enable_ssh_access
  ssh_allowed_cidr_blocks = var.ssh_allowed_cidr_blocks
  enable_waf              = var.enable_waf
  waf_rate_limit          = var.waf_rate_limit
  s3_bucket_arns          = [] # Will be populated after storage module
  tags                    = local.common_tags
}

# Storage Module
module "storage" {
  source = "../../modules/storage"

  environment        = var.environment
  project_name       = local.project_name
  name_prefix        = local.name_prefix
  logs_bucket_name   = "${local.name_prefix}-logs-${random_id.bucket_suffix.hex}"
  static_bucket_name = "${local.name_prefix}-static-${random_id.bucket_suffix.hex}"
  enable_cloudfront  = var.enable_cloudfront
  enable_versioning  = var.enable_s3_versioning
  enable_encryption  = var.enable_s3_encryption
  lifecycle_rules    = var.s3_lifecycle_rules
  tags               = local.common_tags
}

# Generate random suffix for S3 bucket names to ensure uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Database Module
module "database" {
  source = "../../modules/database"

  name_prefix             = local.name_prefix
  database_subnet_ids     = module.networking.database_subnet_ids
  security_group_ids      = [module.security.db_security_group_id]
  db_instance_class       = var.db_instance_class
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_allocated_storage
  storage_type            = var.db_storage_type
  storage_encrypted       = var.db_storage_encrypted
  multi_az                = var.db_multi_az
  backup_retention_period = var.db_backup_retention_period
  backup_window           = var.db_backup_window
  maintenance_window      = var.db_maintenance_window
  enable_redis            = var.enable_redis
  redis_node_type         = var.redis_node_type
  redis_num_cache_nodes   = var.redis_num_cache_nodes
  tags                    = local.common_tags
}

# Compute Module
module "compute" {
  source = "../../modules/compute"

  name_prefix                    = local.name_prefix
  vpc_id                         = module.networking.vpc_id
  public_subnet_ids              = module.networking.public_subnet_ids
  private_subnet_ids             = module.networking.private_subnet_ids
  web_security_group_id          = module.security.web_security_group_id
  app_security_group_id          = module.security.app_security_group_id
  internal_alb_security_group_id = module.security.internal_alb_security_group_id
  ec2_instance_profile_name      = module.security.ec2_instance_profile_name

  # Load Balancer Configuration
  enable_deletion_protection = var.enable_deletion_protection
  enable_access_logs         = var.enable_access_logs
  access_logs_bucket         = var.enable_access_logs ? module.storage.logs_bucket_id : ""

  # SSL/TLS Configuration
  enable_https    = var.enable_https
  certificate_arn = var.certificate_arn
  ssl_policy      = var.ssl_policy

  # Application Configuration
  frontend_port              = local.ports.frontend
  backend_port               = local.ports.backend_api
  frontend_health_check_path = var.frontend_health_check_path
  backend_health_check_path  = var.backend_health_check_path

  # Health Check Configuration
  health_check_healthy_threshold   = var.health_check_healthy_threshold
  health_check_unhealthy_threshold = var.health_check_unhealthy_threshold
  health_check_interval            = var.health_check_interval
  health_check_timeout             = var.health_check_timeout
  health_check_matcher             = var.health_check_matcher
  health_check_grace_period        = var.health_check_grace_period

  # Instance Configuration
  key_name               = var.key_name
  frontend_instance_type = var.frontend_instance_type
  backend_instance_type  = var.backend_instance_type
  frontend_volume_size   = var.frontend_volume_size
  backend_volume_size    = var.backend_volume_size
  volume_type            = var.volume_type
  enable_ebs_encryption  = var.enable_ebs_encryption

  # Auto Scaling Configuration
  frontend_min_size         = var.frontend_min_size
  frontend_max_size         = var.frontend_max_size
  frontend_desired_capacity = var.frontend_desired_capacity
  backend_min_size          = var.backend_min_size
  backend_max_size          = var.backend_max_size
  backend_desired_capacity  = var.backend_desired_capacity

  # Auto Scaling Policy Configuration
  scale_up_adjustment   = var.scale_up_adjustment
  scale_down_adjustment = var.scale_down_adjustment
  scale_up_cooldown     = var.scale_up_cooldown
  scale_down_cooldown   = var.scale_down_cooldown
  cpu_high_threshold    = var.cpu_high_threshold
  cpu_low_threshold     = var.cpu_low_threshold

  # Database Configuration for user data
  database_url = "postgresql://${var.db_username}:${var.db_password}@${module.database.rds_endpoint}:${local.ports.postgresql}/${var.db_name}"
  redis_url    = var.enable_redis ? "redis://${module.database.redis_primary_endpoint}:${local.ports.redis}" : ""

  tags = local.common_tags
}

# DNS Module
module "dns" {
  source = "../../modules/dns"

  zone_name           = var.zone_name
  create_hosted_zone  = var.create_hosted_zone
  existing_zone_id    = var.existing_zone_id
  alb_dns_name        = module.compute.external_alb_dns_name
  alb_zone_id         = module.compute.external_alb_zone_id
  create_health_check = var.enable_health_checks
  health_check_fqdn   = var.health_check_fqdn
  common_tags         = local.common_tags
}
