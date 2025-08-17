# DNS Module Variables

variable "zone_name" {
  description = "The domain name for the Route53 hosted zone"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\\.[a-zA-Z]{2,}$", var.zone_name))
    error_message = "Zone name must be a valid domain name."
  }
}

variable "create_hosted_zone" {
  description = "Whether to create a new hosted zone or use an existing one"
  type        = bool
  default     = true
}

variable "existing_zone_id" {
  description = "The ID of an existing hosted zone to use (required if create_hosted_zone is false)"
  type        = string
  default     = ""

  validation {
    condition     = var.create_hosted_zone || var.existing_zone_id != ""
    error_message = "existing_zone_id must be provided when create_hosted_zone is false."
  }
}

variable "force_destroy_zone" {
  description = "Whether to force destroy the hosted zone even if it contains records"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Application Load Balancer Configuration
variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  type        = string
  default     = ""
}

variable "evaluate_target_health" {
  description = "Whether to evaluate the health of the target for alias records"
  type        = bool
  default     = true
}

# Record Configuration
variable "create_app_record" {
  description = "Whether to create an A record for the application"
  type        = bool
  default     = true
}

variable "app_subdomain" {
  description = "Subdomain for the application (empty string for apex domain)"
  type        = string
  default     = ""
}

variable "create_api_record" {
  description = "Whether to create a CNAME record for the API"
  type        = bool
  default     = true
}

variable "api_subdomain" {
  description = "Subdomain for the API endpoint"
  type        = string
  default     = "api"
}

variable "cname_ttl" {
  description = "TTL for CNAME records"
  type        = number
  default     = 300

  validation {
    condition     = var.cname_ttl >= 60 && var.cname_ttl <= 86400
    error_message = "CNAME TTL must be between 60 and 86400 seconds."
  }
}

# Health Check Configuration
variable "create_health_check" {
  description = "Whether to create Route53 health checks"
  type        = bool
  default     = true
}

variable "health_check_fqdn" {
  description = "FQDN for health check"
  type        = string
  default     = ""
}

variable "health_check_port" {
  description = "Port for health check"
  type        = number
  default     = 443

  validation {
    condition     = var.health_check_port > 0 && var.health_check_port <= 65535
    error_message = "Health check port must be between 1 and 65535."
  }
}

variable "health_check_type" {
  description = "Type of health check (HTTP, HTTPS, TCP)"
  type        = string
  default     = "HTTPS"

  validation {
    condition     = contains(["HTTP", "HTTPS", "TCP"], var.health_check_type)
    error_message = "Health check type must be HTTP, HTTPS, or TCP."
  }
}

variable "health_check_path" {
  description = "Path for HTTP/HTTPS health checks"
  type        = string
  default     = "/health"
}

variable "health_check_failure_threshold" {
  description = "Number of consecutive failures before marking unhealthy"
  type        = number
  default     = 3

  validation {
    condition     = var.health_check_failure_threshold >= 1 && var.health_check_failure_threshold <= 10
    error_message = "Health check failure threshold must be between 1 and 10."
  }
}

variable "health_check_request_interval" {
  description = "Interval between health check requests (30 or 10 seconds)"
  type        = number
  default     = 30

  validation {
    condition     = contains([10, 30], var.health_check_request_interval)
    error_message = "Health check request interval must be 10 or 30 seconds."
  }
}

variable "cloudwatch_logs_region" {
  description = "AWS region for CloudWatch logs"
  type        = string
  default     = ""
}

variable "cloudwatch_alarm_region" {
  description = "AWS region for CloudWatch alarms"
  type        = string
  default     = ""
}

variable "insufficient_data_health_status" {
  description = "Health status when insufficient data is available"
  type        = string
  default     = "Unhealthy"

  validation {
    condition     = contains(["Healthy", "Unhealthy", "LastKnownStatus"], var.insufficient_data_health_status)
    error_message = "Insufficient data health status must be Healthy, Unhealthy, or LastKnownStatus."
  }
}

# Routing Policies
variable "weighted_routing_records" {
  description = "Map of weighted routing records"
  type = map(object({
    name    = string
    type    = string
    ttl     = number
    records = list(string)
    weight  = number
  }))
  default = {}
}

variable "geolocation_routing_records" {
  description = "Map of geolocation routing records"
  type = map(object({
    name        = string
    type        = string
    ttl         = number
    records     = list(string)
    continent   = optional(string)
    country     = optional(string)
    subdivision = optional(string)
  }))
  default = {}
}

# Email Configuration
variable "mx_records" {
  description = "List of MX records for email"
  type        = list(string)
  default     = []
}

variable "mx_ttl" {
  description = "TTL for MX records"
  type        = number
  default     = 3600

  validation {
    condition     = var.mx_ttl >= 60 && var.mx_ttl <= 86400
    error_message = "MX TTL must be between 60 and 86400 seconds."
  }
}

# TXT Records
variable "txt_records" {
  description = "Map of TXT records (name -> list of values)"
  type        = map(list(string))
  default     = {}
}

variable "txt_ttl" {
  description = "TTL for TXT records"
  type        = number
  default     = 300

  validation {
    condition     = var.txt_ttl >= 60 && var.txt_ttl <= 86400
    error_message = "TXT TTL must be between 60 and 86400 seconds."
  }
}

# CAA Records
variable "caa_records" {
  description = "List of CAA records for certificate authority authorization"
  type        = list(string)
  default     = []
}

variable "caa_ttl" {
  description = "TTL for CAA records"
  type        = number
  default     = 3600

  validation {
    condition     = var.caa_ttl >= 60 && var.caa_ttl <= 86400
    error_message = "CAA TTL must be between 60 and 86400 seconds."
  }
}
