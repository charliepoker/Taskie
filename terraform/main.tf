# Root Terraform Configuration for Taskie Infrastructure
# This configuration orchestrates all modules for the complete infrastructure

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "taskie"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Region      = data.aws_region.current.name
    Account     = data.aws_caller_identity.current.account_id
  }
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  name_prefix = local.name_prefix
  environment = var.environment

  # VPC Configuration
  vpc_cidr = var.vpc_cidr

  # Subnet Configuration
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs

  # Feature flags
  enable_nat_gateway = var.enable_nat_gateway
  enable_flow_logs   = var.enable_flow_logs

  common_tags = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id



  # Feature flags
  enable_waf = var.enable_waf

  tags = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  name_prefix = local.name_prefix

  # Network Configuration
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids

  # Security Groups
  web_security_group_id          = module.security.web_security_group_id
  app_security_group_id          = module.security.app_security_group_id
  internal_alb_security_group_id = module.security.internal_alb_security_group_id

  # IAM Configuration
  ec2_instance_profile_name = module.security.ec2_instance_profile_name

  # SSL Configuration
  enable_https    = var.enable_https
  certificate_arn = var.certificate_arn

  # Instance Configuration
  frontend_instance_type = var.frontend_instance_type
  backend_instance_type  = var.backend_instance_type
  key_name               = var.key_name

  # Auto Scaling Configuration
  frontend_min_size         = var.frontend_min_size
  frontend_max_size         = var.frontend_max_size
  frontend_desired_capacity = var.frontend_desired_capacity

  backend_min_size         = var.backend_min_size
  backend_max_size         = var.backend_max_size
  backend_desired_capacity = var.backend_desired_capacity

  # Database Configuration (placeholder values for now)
  database_url = var.database_url
  redis_url    = var.redis_url

  # Monitoring
  enable_detailed_monitoring = var.enable_detailed_monitoring
  enable_asg_metrics         = var.enable_asg_metrics

  tags = local.common_tags
}
