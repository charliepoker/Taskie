# DNS Module - Route53 Configuration
# This module manages Route53 hosted zones, records, and health checks

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  count = var.create_hosted_zone ? 1 : 0

  name          = var.zone_name
  comment       = "Hosted zone for ${var.zone_name} - managed by Terraform"
  force_destroy = var.force_destroy_zone

  tags = merge(var.common_tags, {
    Name = "${var.zone_name}-hosted-zone"
    Type = "DNS"
  })
}

# A Record for Application Load Balancer
resource "aws_route53_record" "app" {
  count = var.create_app_record ? 1 : 0

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = var.app_subdomain != "" ? "${var.app_subdomain}.${var.zone_name}" : var.zone_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = var.evaluate_target_health
  }
}

# CNAME Record for API subdomain
resource "aws_route53_record" "api" {
  count = var.create_api_record ? 1 : 0

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = "${var.api_subdomain}.${var.zone_name}"
  type    = "CNAME"
  ttl     = var.cname_ttl
  records = [var.alb_dns_name]
}

# Health Check for Application Endpoint
resource "aws_route53_health_check" "app" {
  count = var.create_health_check ? 1 : 0

  fqdn              = var.health_check_fqdn
  port              = var.health_check_port
  type              = var.health_check_type
  resource_path     = var.health_check_path
  failure_threshold = var.health_check_failure_threshold
  request_interval  = var.health_check_request_interval

  tags = merge(var.common_tags, {
    Name = "${var.zone_name}-health-check"
    Type = "HealthCheck"
  })
}

# Weighted Routing Policy Records (for blue-green deployments)
resource "aws_route53_record" "weighted" {
  for_each = var.weighted_routing_records

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records

  weighted_routing_policy {
    weight = each.value.weight
  }

  set_identifier  = each.key
  health_check_id = var.create_health_check ? aws_route53_health_check.app[0].id : null
}

# Geolocation Routing Policy Records
resource "aws_route53_record" "geolocation" {
  for_each = var.geolocation_routing_records

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records

  geolocation_routing_policy {
    continent   = lookup(each.value, "continent", null)
    country     = lookup(each.value, "country", null)
    subdivision = lookup(each.value, "subdivision", null)
  }

  set_identifier  = each.key
  health_check_id = var.create_health_check ? aws_route53_health_check.app[0].id : null
}

# MX Records for email
resource "aws_route53_record" "mx" {
  count = length(var.mx_records) > 0 ? 1 : 0

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = var.zone_name
  type    = "MX"
  ttl     = var.mx_ttl
  records = var.mx_records
}

# TXT Records for domain verification
resource "aws_route53_record" "txt" {
  for_each = var.txt_records

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = each.key
  type    = "TXT"
  ttl     = var.txt_ttl
  records = each.value
}

# CAA Records for certificate authority authorization
resource "aws_route53_record" "caa" {
  count = length(var.caa_records) > 0 ? 1 : 0

  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : var.existing_zone_id
  name    = var.zone_name
  type    = "CAA"
  ttl     = var.caa_ttl
  records = var.caa_records
}
