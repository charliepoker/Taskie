# Networking-specific local values
locals {
  # Common tags for networking resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "Networking"
  }

  # Naming conventions for networking resources
  name_prefix = "${var.project_name}-${var.environment}"

  # Security group naming
  alb_sg_name     = "${local.name_prefix}-alb-sg"
  app_sg_name     = "${local.name_prefix}-app-sg"
  db_sg_name      = "${local.name_prefix}-db-sg"
  redis_sg_name   = "${local.name_prefix}-redis-sg"
  bastion_sg_name = "${local.name_prefix}-bastion-sg"

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
