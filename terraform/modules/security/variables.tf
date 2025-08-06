variable "name_prefix" {
  description = "Prefix for naming resources"
  type        = string
  validation {
    condition     = length(var.name_prefix) > 0 && length(var.name_prefix) <= 20
    error_message = "Name prefix must be between 1 and 20 characters."
  }
}

variable "vpc_id" {
  description = "ID of the VPC where security groups will be created"
  type        = string
  validation {
    condition     = can(regex("^vpc-[a-z0-9]+$", var.vpc_id))
    error_message = "VPC ID must be a valid VPC identifier (vpc-xxxxxxxx)."
  }
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the web tier"
  type        = list(string)
  default     = ["0.0.0.0/0"]
  validation {
    condition = alltrue([
      for cidr in var.allowed_cidr_blocks : can(cidrhost(cidr, 0))
    ])
    error_message = "All CIDR blocks must be valid CIDR notation."
  }
}

variable "app_port" {
  description = "Port number for the application"
  type        = number
  default     = 3000
  validation {
    condition     = var.app_port > 0 && var.app_port <= 65535
    error_message = "Application port must be between 1 and 65535."
  }
}

variable "enable_ssh_access" {
  description = "Whether to enable SSH access to application instances"
  type        = bool
  default     = false
}

variable "ssh_allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed SSH access to application instances"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for cidr in var.ssh_allowed_cidr_blocks : can(cidrhost(cidr, 0))
    ])
    error_message = "All SSH CIDR blocks must be valid CIDR notation."
  }
}

variable "enable_waf" {
  description = "Whether to create a WAF Web ACL"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "Rate limit for WAF (requests per 5-minute period)"
  type        = number
  default     = 2000
  validation {
    condition     = var.waf_rate_limit >= 100 && var.waf_rate_limit <= 20000000
    error_message = "WAF rate limit must be between 100 and 20,000,000."
  }
}

variable "s3_bucket_arns" {
  description = "List of S3 bucket ARNs that EC2 instances need access to"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for arn in var.s3_bucket_arns : can(regex("^arn:aws:s3:::[a-z0-9.-]+(/.*)?$", arn))
    ])
    error_message = "All S3 bucket ARNs must be valid ARN format."
  }
}

variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
  validation {
    condition = alltrue([
      for key, value in var.tags : length(key) <= 128 && length(value) <= 256
    ])
    error_message = "Tag keys must be 128 characters or less, and values must be 256 characters or less."
  }
}
