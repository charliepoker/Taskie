# Cache-specific local values
locals {
  # Common tags for cache resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "Cache"
  }

  # Naming conventions for cache resources
  name_prefix = "${var.project_name}-${var.environment}"

  # Redis cluster naming
  redis_cluster_name         = "${local.name_prefix}-redis"
  redis_subnet_group_name    = "${local.name_prefix}-redis-subnet-group"
  redis_parameter_group_name = "${local.name_prefix}-redis-params"
}
