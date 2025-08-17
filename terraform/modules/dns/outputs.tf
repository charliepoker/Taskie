# DNS Module Outputs

# Hosted Zone Outputs
output "zone_id" {
  description = "The hosted zone ID"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
}

output "zone_arn" {
  description = "The hosted zone ARN"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].arn : null
}

output "name_servers" {
  description = "List of name servers for the hosted zone"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : []
}

output "zone_name" {
  description = "The domain name of the hosted zone"
  value       = var.zone_name
}

# Record Outputs
output "app_record_name" {
  description = "The name of the application A record"
  value       = var.create_app_record && var.alb_dns_name != "" ? aws_route53_record.app[0].name : null
}

output "app_record_fqdn" {
  description = "The FQDN of the application A record"
  value       = var.create_app_record && var.alb_dns_name != "" ? aws_route53_record.app[0].fqdn : null
}

output "api_record_name" {
  description = "The name of the API CNAME record"
  value       = var.create_api_record && var.alb_dns_name != "" ? aws_route53_record.api[0].name : null
}

output "api_record_fqdn" {
  description = "The FQDN of the API CNAME record"
  value       = var.create_api_record && var.alb_dns_name != "" ? aws_route53_record.api[0].fqdn : null
}

# Health Check Outputs
output "health_check_id" {
  description = "The ID of the Route53 health check"
  value       = var.create_health_check && var.health_check_fqdn != "" ? aws_route53_health_check.app[0].id : null
}

output "health_check_arn" {
  description = "The ARN of the Route53 health check"
  value       = var.create_health_check && var.health_check_fqdn != "" ? aws_route53_health_check.app[0].arn : null
}

# Routing Policy Outputs
output "weighted_record_names" {
  description = "Map of weighted routing record names"
  value       = { for k, v in aws_route53_record.weighted : k => v.name }
}

output "weighted_record_fqdns" {
  description = "Map of weighted routing record FQDNs"
  value       = { for k, v in aws_route53_record.weighted : k => v.fqdn }
}

output "geolocation_record_names" {
  description = "Map of geolocation routing record names"
  value       = { for k, v in aws_route53_record.geolocation : k => v.name }
}

output "geolocation_record_fqdns" {
  description = "Map of geolocation routing record FQDNs"
  value       = { for k, v in aws_route53_record.geolocation : k => v.fqdn }
}

# Email and Verification Outputs
output "mx_record_name" {
  description = "The name of the MX record"
  value       = length(var.mx_records) > 0 ? aws_route53_record.mx[0].name : null
}

output "txt_record_names" {
  description = "Map of TXT record names"
  value       = { for k, v in aws_route53_record.txt : k => v.name }
}

output "txt_record_fqdns" {
  description = "Map of TXT record FQDNs"
  value       = { for k, v in aws_route53_record.txt : k => v.fqdn }
}

output "caa_record_name" {
  description = "The name of the CAA record"
  value       = length(var.caa_records) > 0 ? aws_route53_record.caa[0].name : null
}

# Summary Outputs for Easy Reference
output "dns_summary" {
  description = "Summary of DNS configuration"
  value = {
    zone_name    = var.zone_name
    zone_id      = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
    app_endpoint = var.create_app_record && var.alb_dns_name != "" ? aws_route53_record.app[0].fqdn : null
    api_endpoint = var.create_api_record && var.alb_dns_name != "" ? aws_route53_record.api[0].fqdn : null
    health_check = var.create_health_check && var.health_check_fqdn != "" ? aws_route53_health_check.app[0].id : null
    name_servers = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : []
  }
}
