# WAF and DNS-specific local values
locals {
  # Common tags for WAF and DNS resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "WAF_DNS"
  }

  # Naming conventions for WAF and DNS resources
  name_prefix = "${var.project_name}-${var.environment}"

  # WAF naming
  waf_web_acl_name    = "${local.name_prefix}-waf"
  waf_ip_set_name     = "${local.name_prefix}-allowed-ips"
  waf_rule_group_name = "${local.name_prefix}-rules"

  # Route53 naming
  hosted_zone_name = var.domain_name
  record_prefix    = var.environment == "prod" ? "" : "${var.environment}."
}
