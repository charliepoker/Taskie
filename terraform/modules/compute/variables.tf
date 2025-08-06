# Variables for Compute Module

# General Configuration
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  validation {
    condition     = length(var.name_prefix) > 0 && length(var.name_prefix) <= 20
    error_message = "Name prefix must be between 1 and 20 characters."
  }
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vpc_id" {
  description = "ID of the VPC where resources will be created"
  type        = string
  validation {
    condition     = can(regex("^vpc-", var.vpc_id))
    error_message = "VPC ID must be a valid VPC identifier starting with 'vpc-'."
  }
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for external load balancer"
  type        = list(string)
  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "At least 2 public subnets are required for high availability."
  }
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for instances and internal load balancer"
  type        = list(string)
  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "At least 2 private subnets are required for high availability."
  }
}

# Security Group Configuration
variable "web_security_group_id" {
  description = "Security group ID for external load balancer"
  type        = string
  validation {
    condition     = can(regex("^sg-", var.web_security_group_id))
    error_message = "Security group ID must be a valid security group identifier starting with 'sg-'."
  }
}

variable "app_security_group_id" {
  description = "Security group ID for application instances"
  type        = string
  validation {
    condition     = can(regex("^sg-", var.app_security_group_id))
    error_message = "Security group ID must be a valid security group identifier starting with 'sg-'."
  }
}

variable "internal_alb_security_group_id" {
  description = "Security group ID for internal load balancer"
  type        = string
  validation {
    condition     = can(regex("^sg-", var.internal_alb_security_group_id))
    error_message = "Security group ID must be a valid security group identifier starting with 'sg-'."
  }
}

# IAM Configuration
variable "ec2_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2 instances"
  type        = string
}

# Load Balancer Configuration
variable "enable_deletion_protection" {
  description = "Enable deletion protection for load balancers"
  type        = bool
  default     = false
}

variable "enable_access_logs" {
  description = "Enable access logs for load balancers"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket name for load balancer access logs"
  type        = string
  default     = ""
}

# SSL/TLS Configuration
variable "enable_https" {
  description = "Enable HTTPS listener on external load balancer"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS listener"
  type        = string
  default     = ""
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
  validation {
    condition = contains([
      "ELBSecurityPolicy-TLS-1-2-2017-01",
      "ELBSecurityPolicy-TLS-1-2-Ext-2018-06",
      "ELBSecurityPolicy-FS-2018-06",
      "ELBSecurityPolicy-FS-1-2-2019-08",
      "ELBSecurityPolicy-FS-1-2-Res-2019-08",
      "ELBSecurityPolicy-FS-1-2-Res-2020-10",
      "ELBSecurityPolicy-TLS-1-1-2017-01",
      "ELBSecurityPolicy-2016-08"
    ], var.ssl_policy)
    error_message = "SSL policy must be a valid ELB security policy."
  }
}

# Application Configuration
variable "frontend_port" {
  description = "Port for frontend application"
  type        = number
  default     = 3000
  validation {
    condition     = var.frontend_port > 0 && var.frontend_port <= 65535
    error_message = "Frontend port must be between 1 and 65535."
  }
}

variable "backend_port" {
  description = "Port for backend application"
  type        = number
  default     = 8000
  validation {
    condition     = var.backend_port > 0 && var.backend_port <= 65535
    error_message = "Backend port must be between 1 and 65535."
  }
}

variable "frontend_health_check_path" {
  description = "Health check path for frontend"
  type        = string
  default     = "/"
}

variable "backend_health_check_path" {
  description = "Health check path for backend"
  type        = string
  default     = "/health"
}

# Health Check Configuration
variable "health_check_healthy_threshold" {
  description = "Number of consecutive health checks successes required before considering an unhealthy target healthy"
  type        = number
  default     = 2
  validation {
    condition     = var.health_check_healthy_threshold >= 2 && var.health_check_healthy_threshold <= 10
    error_message = "Health check healthy threshold must be between 2 and 10."
  }
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive health check failures required before considering a target unhealthy"
  type        = number
  default     = 2
  validation {
    condition     = var.health_check_unhealthy_threshold >= 2 && var.health_check_unhealthy_threshold <= 10
    error_message = "Health check unhealthy threshold must be between 2 and 10."
  }
}

variable "health_check_interval" {
  description = "Approximate amount of time, in seconds, between health checks of an individual target"
  type        = number
  default     = 30
  validation {
    condition     = var.health_check_interval >= 5 && var.health_check_interval <= 300
    error_message = "Health check interval must be between 5 and 300 seconds."
  }
}

variable "health_check_timeout" {
  description = "Amount of time, in seconds, during which no response means a failed health check"
  type        = number
  default     = 5
  validation {
    condition     = var.health_check_timeout >= 2 && var.health_check_timeout <= 120
    error_message = "Health check timeout must be between 2 and 120 seconds."
  }
}

variable "health_check_matcher" {
  description = "HTTP codes to use when checking for a successful response from a target"
  type        = string
  default     = "200"
}

variable "health_check_grace_period" {
  description = "Time (in seconds) after instance comes into service before checking health"
  type        = number
  default     = 300
  validation {
    condition     = var.health_check_grace_period >= 0 && var.health_check_grace_period <= 7200
    error_message = "Health check grace period must be between 0 and 7200 seconds."
  }
}

# Target Group Configuration
variable "enable_stickiness" {
  description = "Enable stickiness for target groups"
  type        = bool
  default     = false
}

variable "stickiness_duration" {
  description = "Time period, in seconds, during which requests from a client should be routed to the same target"
  type        = number
  default     = 86400
  validation {
    condition     = var.stickiness_duration >= 1 && var.stickiness_duration <= 604800
    error_message = "Stickiness duration must be between 1 and 604800 seconds (7 days)."
  }
}

# Instance Configuration
variable "key_name" {
  description = "Name of the AWS key pair for EC2 instances"
  type        = string
  default     = ""
}

variable "frontend_ami_id" {
  description = "AMI ID for frontend instances (defaults to latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "backend_ami_id" {
  description = "AMI ID for backend instances (defaults to latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "frontend_instance_type" {
  description = "Instance type for frontend instances"
  type        = string
  default     = "t3.micro"
  validation {
    condition = contains([
      "t3.nano", "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge",
      "t2.nano", "t2.micro", "t2.small", "t2.medium", "t2.large", "t2.xlarge", "t2.2xlarge",
      "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge", "m5.8xlarge", "m5.12xlarge", "m5.16xlarge", "m5.24xlarge",
      "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c5.9xlarge", "c5.12xlarge", "c5.18xlarge", "c5.24xlarge"
    ], var.frontend_instance_type)
    error_message = "Frontend instance type must be a valid EC2 instance type."
  }
}

variable "backend_instance_type" {
  description = "Instance type for backend instances"
  type        = string
  default     = "t3.small"
  validation {
    condition = contains([
      "t3.nano", "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge",
      "t2.nano", "t2.micro", "t2.small", "t2.medium", "t2.large", "t2.xlarge", "t2.2xlarge",
      "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge", "m5.8xlarge", "m5.12xlarge", "m5.16xlarge", "m5.24xlarge",
      "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c5.9xlarge", "c5.12xlarge", "c5.18xlarge", "c5.24xlarge"
    ], var.backend_instance_type)
    error_message = "Backend instance type must be a valid EC2 instance type."
  }
}

# Storage Configuration
variable "frontend_volume_size" {
  description = "Size of the EBS volume for frontend instances (in GB)"
  type        = number
  default     = 20
  validation {
    condition     = var.frontend_volume_size >= 8 && var.frontend_volume_size <= 16384
    error_message = "Frontend volume size must be between 8 and 16384 GB."
  }
}

variable "backend_volume_size" {
  description = "Size of the EBS volume for backend instances (in GB)"
  type        = number
  default     = 20
  validation {
    condition     = var.backend_volume_size >= 8 && var.backend_volume_size <= 16384
    error_message = "Backend volume size must be between 8 and 16384 GB."
  }
}

variable "volume_type" {
  description = "Type of EBS volume"
  type        = string
  default     = "gp3"
  validation {
    condition     = contains(["gp2", "gp3", "io1", "io2", "sc1", "st1"], var.volume_type)
    error_message = "Volume type must be one of: gp2, gp3, io1, io2, sc1, st1."
  }
}

variable "enable_ebs_encryption" {
  description = "Enable EBS encryption for instance volumes"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for EC2 instances"
  type        = bool
  default     = false
}

variable "enable_asg_metrics" {
  description = "Enable Auto Scaling Group metrics"
  type        = bool
  default     = true
}

# Auto Scaling Configuration
variable "frontend_min_size" {
  description = "Minimum number of frontend instances"
  type        = number
  default     = 1
  validation {
    condition     = var.frontend_min_size >= 0 && var.frontend_min_size <= 1000
    error_message = "Frontend minimum size must be between 0 and 1000."
  }
}

variable "frontend_max_size" {
  description = "Maximum number of frontend instances"
  type        = number
  default     = 3
  validation {
    condition     = var.frontend_max_size >= 1 && var.frontend_max_size <= 1000
    error_message = "Frontend maximum size must be between 1 and 1000."
  }
}

variable "frontend_desired_capacity" {
  description = "Desired number of frontend instances"
  type        = number
  default     = 2
  validation {
    condition     = var.frontend_desired_capacity >= 0 && var.frontend_desired_capacity <= 1000
    error_message = "Frontend desired capacity must be between 0 and 1000."
  }
}

variable "backend_min_size" {
  description = "Minimum number of backend instances"
  type        = number
  default     = 1
  validation {
    condition     = var.backend_min_size >= 0 && var.backend_min_size <= 1000
    error_message = "Backend minimum size must be between 0 and 1000."
  }
}

variable "backend_max_size" {
  description = "Maximum number of backend instances"
  type        = number
  default     = 5
  validation {
    condition     = var.backend_max_size >= 1 && var.backend_max_size <= 1000
    error_message = "Backend maximum size must be between 1 and 1000."
  }
}

variable "backend_desired_capacity" {
  description = "Desired number of backend instances"
  type        = number
  default     = 2
  validation {
    condition     = var.backend_desired_capacity >= 0 && var.backend_desired_capacity <= 1000
    error_message = "Backend desired capacity must be between 0 and 1000."
  }
}

# Auto Scaling Policy Configuration
variable "scale_up_adjustment" {
  description = "Number of instances to add when scaling up"
  type        = number
  default     = 1
  validation {
    condition     = var.scale_up_adjustment >= 1 && var.scale_up_adjustment <= 100
    error_message = "Scale up adjustment must be between 1 and 100."
  }
}

variable "scale_down_adjustment" {
  description = "Number of instances to remove when scaling down (negative value)"
  type        = number
  default     = -1
  validation {
    condition     = var.scale_down_adjustment >= -100 && var.scale_down_adjustment <= -1
    error_message = "Scale down adjustment must be between -100 and -1."
  }
}

variable "scale_up_cooldown" {
  description = "Cooldown period (in seconds) after a scale up activity"
  type        = number
  default     = 300
  validation {
    condition     = var.scale_up_cooldown >= 0 && var.scale_up_cooldown <= 3600
    error_message = "Scale up cooldown must be between 0 and 3600 seconds."
  }
}

variable "scale_down_cooldown" {
  description = "Cooldown period (in seconds) after a scale down activity"
  type        = number
  default     = 300
  validation {
    condition     = var.scale_down_cooldown >= 0 && var.scale_down_cooldown <= 3600
    error_message = "Scale down cooldown must be between 0 and 3600 seconds."
  }
}

# CloudWatch Alarm Configuration
variable "cpu_high_threshold" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 70
  validation {
    condition     = var.cpu_high_threshold >= 1 && var.cpu_high_threshold <= 100
    error_message = "CPU high threshold must be between 1 and 100."
  }
}

variable "cpu_low_threshold" {
  description = "CPU utilization threshold for scaling down"
  type        = number
  default     = 20
  validation {
    condition     = var.cpu_low_threshold >= 1 && var.cpu_low_threshold <= 100
    error_message = "CPU low threshold must be between 1 and 100."
  }
}

# Database Configuration (for user data scripts)
variable "database_url" {
  description = "Database connection URL for backend instances"
  type        = string
  default     = ""
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection URL for backend instances"
  type        = string
  default     = ""
  sensitive   = true
}
