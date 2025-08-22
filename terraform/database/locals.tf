# Database-specific local values
locals {
  # Common tags for database resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "Database"
  }

  # Naming conventions for database resources
  name_prefix = "${var.project_name}-${var.environment}"

  # RDS naming
  db_instance_name        = "${local.name_prefix}-postgres"
  db_subnet_group_name    = "${local.name_prefix}-db-subnet-group"
  db_parameter_group_name = "${local.name_prefix}-db-params"
  db_option_group_name    = "${local.name_prefix}-db-options"

  # Database configuration
  db_name = replace("${var.project_name}_${var.environment}", "-", "_")
}
