# Load Balancer-specific local values
locals {
  # Common tags for load balancer resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "LoadBalancer"
  }

  # Naming conventions for load balancer resources
  name_prefix = "${var.project_name}-${var.environment}"

  # ALB naming
  alb_name          = "${local.name_prefix}-alb"
  target_group_name = "${local.name_prefix}-tg"

  # Listener naming
  http_listener_name  = "${local.name_prefix}-http-listener"
  https_listener_name = "${local.name_prefix}-https-listener"
}
