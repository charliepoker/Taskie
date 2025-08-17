# Compute-specific local values
locals {
  # Common tags for compute resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "Compute"
  }

  # Naming conventions for compute resources
  name_prefix = "${var.project_name}-${var.environment}"

  # EC2 and Auto Scaling naming
  launch_template_name    = "${local.name_prefix}-lt"
  auto_scaling_group_name = "${local.name_prefix}-asg"
  target_group_name       = "${local.name_prefix}-tg"

  # Instance naming
  backend_instance_name  = "${local.name_prefix}-backend"
  frontend_instance_name = "${local.name_prefix}-frontend"
}
