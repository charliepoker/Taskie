# Storage-specific local values
locals {
  # Common tags for storage resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "Storage"
  }

  # Naming conventions for storage resources
  name_prefix = "${var.project_name}-${var.environment}"

  # S3 bucket naming
  app_bucket_name    = "${local.name_prefix}-app-storage"
  logs_bucket_name   = "${local.name_prefix}-logs"
  backup_bucket_name = "${local.name_prefix}-backups"
  static_bucket_name = "${local.name_prefix}-static-assets"
}
