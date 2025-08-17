# Outputs for Staging Environment

# General Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "name_prefix" {
  description = "Name prefix used for all resources"
  value       = local.name_prefix
}

# Networking Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = module.networking.database_subnet_ids
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = module.networking.availability_zones
}

# Security Outputs
output "web_security_group_id" {
  description = "Security group ID for web tier"
  value       = module.security.web_security_group_id
}

output "app_security_group_id" {
  description = "Security group ID for application tier"
  value       = module.security.app_security_group_id
}

output "db_security_group_id" {
  description = "Security group ID for database tier"
  value       = module.security.db_security_group_id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL (if enabled)"
  value       = var.enable_waf ? module.security.waf_web_acl_arn : null
}

# Storage Outputs
output "logs_bucket_id" {
  description = "ID of the logs S3 bucket"
  value       = module.storage.logs_bucket_id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = module.storage.logs_bucket_arn
}

output "static_bucket_id" {
  description = "ID of the static assets S3 bucket"
  value       = module.storage.static_bucket_id
}

output "static_bucket_arn" {
  description = "ARN of the static assets S3 bucket"
  value       = module.storage.static_bucket_arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution (if enabled)"
  value       = var.enable_cloudfront ? module.storage.cloudfront_domain_name : null
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.database.rds_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.database.rds_database_name
}

output "redis_endpoint" {
  description = "Redis cluster endpoint (if enabled)"
  value       = var.enable_redis ? module.database.redis_primary_endpoint : null
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port (if enabled)"
  value       = var.enable_redis ? module.database.redis_port : null
}

# Compute Outputs
output "external_alb_dns_name" {
  description = "DNS name of the external Application Load Balancer"
  value       = module.compute.external_alb_dns_name
}

output "external_alb_zone_id" {
  description = "Zone ID of the external Application Load Balancer"
  value       = module.compute.external_alb_zone_id
}

output "internal_alb_dns_name" {
  description = "DNS name of the internal Application Load Balancer"
  value       = module.compute.internal_alb_dns_name
}

output "internal_alb_zone_id" {
  description = "Zone ID of the internal Application Load Balancer"
  value       = module.compute.internal_alb_zone_id
}

output "frontend_auto_scaling_group_arn" {
  description = "ARN of the frontend Auto Scaling Group"
  value       = module.compute.frontend_asg_arn
}

output "backend_auto_scaling_group_arn" {
  description = "ARN of the backend Auto Scaling Group"
  value       = module.compute.backend_asg_arn
}

output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = module.compute.frontend_target_group_arn
}

output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = module.compute.backend_target_group_arn
}

# DNS Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID (if domain is configured)"
  value       = var.zone_name != "" ? module.dns.zone_id : null
}

output "route53_name_servers" {
  description = "Route53 hosted zone name servers (if domain is configured)"
  value       = var.zone_name != "" ? module.dns.name_servers : null
}

# Application URLs
output "application_url" {
  description = "URL to access the application"
  value       = var.enable_https ? "https://${module.compute.external_alb_dns_name}" : "http://${module.compute.external_alb_dns_name}"
}

output "backend_api_url" {
  description = "URL to access the backend API (internal)"
  value       = "http://${module.compute.internal_alb_dns_name}"
}

# Connection Information
output "database_connection_info" {
  description = "Database connection information"
  value = {
    endpoint = module.database.rds_endpoint
    port     = module.database.rds_port
    database = module.database.rds_database_name
    username = var.db_username
  }
  sensitive = true
}

output "redis_connection_info" {
  description = "Redis connection information (if enabled)"
  value = var.enable_redis ? {
    endpoint = module.database.redis_primary_endpoint
    port     = module.database.redis_port
  } : null
  sensitive = true
}

# Resource Counts and Costs Information
output "resource_summary" {
  description = "Summary of deployed resources for cost tracking"
  value = {
    vpc_count            = 1
    subnet_count         = length(var.public_subnet_cidrs) + length(var.private_subnet_cidrs) + length(var.database_subnet_cidrs)
    nat_gateway_count    = var.enable_nat_gateway ? length(var.public_subnet_cidrs) : 0
    security_group_count = 3 # web, app, db
    load_balancer_count  = 2 # external, internal
    rds_instance_count   = 1
    redis_cluster_count  = var.enable_redis ? 1 : 0
    s3_bucket_count      = 2 # logs, static
    cloudfront_count     = var.enable_cloudfront ? 1 : 0
    route53_zone_count   = var.zone_name != "" ? 1 : 0
    waf_count            = var.enable_waf ? 1 : 0
  }
}

# Tags Applied
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Staging-specific Information
output "staging_features" {
  description = "Features enabled in staging environment"
  value = {
    multi_az_database     = var.db_multi_az
    waf_enabled           = var.enable_waf
    cloudfront_enabled    = var.enable_cloudfront
    flow_logs_enabled     = var.enable_flow_logs
    access_logs_enabled   = var.enable_access_logs
    https_enabled         = var.enable_https
    health_checks_enabled = var.enable_health_checks
    deletion_protection   = var.enable_deletion_protection
  }
}
