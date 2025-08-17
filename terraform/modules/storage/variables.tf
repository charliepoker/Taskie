# Storage Module Variables

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "logs_bucket_name" {
  description = "Name for the S3 bucket that will store application logs"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9.-]+$", var.logs_bucket_name)) && length(var.logs_bucket_name) >= 3 && length(var.logs_bucket_name) <= 63
    error_message = "Logs bucket name must be between 3 and 63 characters, contain only lowercase letters, numbers, dots, and hyphens."
  }
}

variable "static_bucket_name" {
  description = "Name for the S3 bucket that will store static assets"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9.-]+$", var.static_bucket_name)) && length(var.static_bucket_name) >= 3 && length(var.static_bucket_name) <= 63
    error_message = "Static bucket name must be between 3 and 63 characters, contain only lowercase letters, numbers, dots, and hyphens."
  }
}

variable "enable_versioning" {
  description = "Enable versioning on S3 buckets"
  type        = bool
  default     = true
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for static assets"
  type        = bool
  default     = true
}

# Lifecycle configuration variables for logs bucket
variable "logs_transition_to_ia_days" {
  description = "Number of days after which logs transition to Infrequent Access storage class"
  type        = number
  default     = 30
  validation {
    condition     = var.logs_transition_to_ia_days >= 1
    error_message = "Transition to IA days must be at least 1."
  }
}

variable "logs_transition_to_glacier_days" {
  description = "Number of days after which logs transition to Glacier storage class"
  type        = number
  default     = 90
  validation {
    condition     = var.logs_transition_to_glacier_days >= 1
    error_message = "Transition to Glacier days must be at least 1."
  }
}

variable "logs_expiration_days" {
  description = "Number of days after which logs are permanently deleted"
  type        = number
  default     = 365
  validation {
    condition     = var.logs_expiration_days >= 1
    error_message = "Expiration days must be at least 1."
  }
}

variable "logs_noncurrent_version_expiration_days" {
  description = "Number of days after which non-current versions of logs are deleted"
  type        = number
  default     = 30
  validation {
    condition     = var.logs_noncurrent_version_expiration_days >= 1
    error_message = "Non-current version expiration days must be at least 1."
  }
}

# CloudFront configuration variables
variable "cloudfront_default_root_object" {
  description = "Default root object for CloudFront distribution"
  type        = string
  default     = "index.html"
}

variable "cloudfront_min_ttl" {
  description = "Minimum TTL for CloudFront cache behavior (seconds)"
  type        = number
  default     = 0
  validation {
    condition     = var.cloudfront_min_ttl >= 0
    error_message = "Minimum TTL must be non-negative."
  }
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache behavior (seconds)"
  type        = number
  default     = 86400 # 24 hours
  validation {
    condition     = var.cloudfront_default_ttl >= 0
    error_message = "Default TTL must be non-negative."
  }
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache behavior (seconds)"
  type        = number
  default     = 31536000 # 1 year
  validation {
    condition     = var.cloudfront_max_ttl >= 0
    error_message = "Maximum TTL must be non-negative."
  }
}

variable "cloudfront_price_class" {
  description = "Price class for CloudFront distribution"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = can(regex("^PriceClass_(All|200|100)$", var.cloudfront_price_class))
    error_message = "Price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

variable "cloudfront_geo_restriction_type" {
  description = "Type of geo restriction for CloudFront distribution"
  type        = string
  default     = "none"
  validation {
    condition     = can(regex("^(none|whitelist|blacklist)$", var.cloudfront_geo_restriction_type))
    error_message = "Geo restriction type must be one of: none, whitelist, blacklist."
  }
}

variable "cloudfront_geo_restriction_locations" {
  description = "List of country codes for geo restriction"
  type        = list(string)
  default     = []
  validation {
    condition     = alltrue([for loc in var.cloudfront_geo_restriction_locations : can(regex("^[A-Z]{2}$", loc))])
    error_message = "All geo restriction locations must be valid 2-letter country codes."
  }
}

variable "cloudfront_acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront distribution (optional)"
  type        = string
  default     = null
  validation {
    condition     = var.cloudfront_acm_certificate_arn == null || can(regex("^arn:aws:acm:", var.cloudfront_acm_certificate_arn))
    error_message = "ACM certificate ARN must be a valid ARN starting with 'arn:aws:acm:'."
  }
}

variable "cloudfront_api_cache_behavior_enabled" {
  description = "Enable special cache behavior for API requests"
  type        = bool
  default     = false
}

# Additional variables needed by the module
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  validation {
    condition     = length(var.name_prefix) > 0 && length(var.name_prefix) <= 20
    error_message = "Name prefix must be between 1 and 20 characters."
  }
}

variable "enable_encryption" {
  description = "Enable encryption for S3 buckets"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "S3 lifecycle rules configuration"
  type        = any
  default     = {}
}

variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
  validation {
    condition     = length(var.tags) <= 50
    error_message = "Cannot specify more than 50 tags (AWS limit)."
  }
}
