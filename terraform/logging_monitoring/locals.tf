# Logging and Monitoring-specific local values
locals {
  # Common tags for logging and monitoring resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "LoggingMonitoring"
  }

  # Naming conventions for logging and monitoring resources
  name_prefix = "${var.project_name}-${var.environment}"

  # CloudWatch naming
  log_group_name = "/aws/ec2/${local.name_prefix}"
  dashboard_name = "${local.name_prefix}-dashboard"

  # SNS and alarms
  sns_topic_name = "${local.name_prefix}-alerts"
  alarm_prefix   = "${local.name_prefix}-alarm"
}
