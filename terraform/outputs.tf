# Root Terraform Outputs

# Networking Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

# Security Outputs
output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.security.web_security_group_id
}

output "app_security_group_id" {
  description = "ID of the app security group"
  value       = module.security.app_security_group_id
}

# Compute Outputs
output "external_alb_dns_name" {
  description = "DNS name of the external load balancer"
  value       = module.compute.external_alb_dns_name
}

output "internal_alb_dns_name" {
  description = "DNS name of the internal load balancer"
  value       = module.compute.internal_alb_dns_name
}

output "application_url" {
  description = "URL to access the application"
  value       = module.compute.application_url
}

output "frontend_asg_name" {
  description = "Name of the frontend Auto Scaling Group"
  value       = module.compute.frontend_asg_name
}

output "backend_asg_name" {
  description = "Name of the backend Auto Scaling Group"
  value       = module.compute.backend_asg_name
}

# Summary Output
output "infrastructure_summary" {
  description = "Summary of created infrastructure"
  value = {
    vpc_id           = module.networking.vpc_id
    application_url  = module.compute.application_url
    frontend_asg     = module.compute.frontend_asg_name
    backend_asg      = module.compute.backend_asg_name
    external_alb_dns = module.compute.external_alb_dns_name
    internal_alb_dns = module.compute.internal_alb_dns_name
  }
}
