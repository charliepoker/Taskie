# Storage Module Outputs

# S3 Bucket Outputs
output "logs_bucket_id" {
  description = "ID of the S3 bucket for application logs"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the S3 bucket for application logs"
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_domain_name" {
  description = "Domain name of the S3 bucket for application logs"
  value       = aws_s3_bucket.logs.bucket_domain_name
}

output "logs_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket for application logs"
  value       = aws_s3_bucket.logs.bucket_regional_domain_name
}

output "static_bucket_id" {
  description = "ID of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.id
}

output "static_bucket_arn" {
  description = "ARN of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.arn
}

output "static_bucket_domain_name" {
  description = "Domain name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket_domain_name
}

output "static_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket_regional_domain_name
}

# CloudFront Outputs (conditional)
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for static assets"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.static_assets[0].id : null
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution for static assets"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.static_assets[0].arn : null
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for static assets"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.static_assets[0].domain_name : null
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution for static assets"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.static_assets[0].hosted_zone_id : null
}

output "cloudfront_origin_access_control_id" {
  description = "ID of the CloudFront Origin Access Control"
  value       = var.enable_cloudfront ? aws_cloudfront_origin_access_control.static_assets[0].id : null
}

# Bucket Configuration Outputs
output "logs_bucket_versioning_enabled" {
  description = "Whether versioning is enabled on the logs bucket"
  value       = var.enable_versioning
}

output "static_bucket_versioning_enabled" {
  description = "Whether versioning is enabled on the static assets bucket"
  value       = var.enable_versioning
}

output "cloudfront_enabled" {
  description = "Whether CloudFront distribution is enabled"
  value       = var.enable_cloudfront
}

# Lifecycle Configuration Outputs
output "logs_lifecycle_configuration" {
  description = "Lifecycle configuration details for the logs bucket"
  value = {
    transition_to_ia_days              = var.logs_transition_to_ia_days
    transition_to_glacier_days         = var.logs_transition_to_glacier_days
    expiration_days                    = var.logs_expiration_days
    noncurrent_version_expiration_days = var.logs_noncurrent_version_expiration_days
  }
}
