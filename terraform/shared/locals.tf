# Common local values used across all environments and modules
locals {
  # Project configuration
  project_name = "taskie"
  owner        = "Obinna Iheanacho"

  # Common tags applied to all resources
  common_tags = {
    Project     = local.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = local.owner
  }
  

  # Naming conventions
  name_prefix = "${local.project_name}-${var.environment}"

  # Common resource naming patterns
  naming = {
    vpc                = "${local.name_prefix}-vpc"
    public_subnet      = "${local.name_prefix}-public"
    private_subnet     = "${local.name_prefix}-private"
    database_subnet    = "${local.name_prefix}-database"
    security_group     = "${local.name_prefix}-sg"
    load_balancer      = "${local.name_prefix}-alb"
    auto_scaling_group = "${local.name_prefix}-asg"
    launch_template    = "${local.name_prefix}-lt"
    rds_instance       = "${local.name_prefix}-rds"
    redis_cluster      = "${local.name_prefix}-redis"
    s3_bucket          = "${local.name_prefix}-s3"
    route53_zone       = "${local.name_prefix}-zone"
  }

  # Common availability zones pattern
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]

  # Common CIDR calculations
  vpc_cidr_newbits = 8 # For /24 subnets from /16 VPC

  # Common instance types by tier
  instance_types = {
    micro  = "t3.micro"
    small  = "t3.small"
    medium = "t3.medium"
    large  = "t3.large"
  }

  # Common database instance types
  db_instance_types = {
    micro  = "db.t3.micro"
    small  = "db.t3.small"
    medium = "db.t3.medium"
    large  = "db.t3.large"
  }

  # Common ports
  ports = {
    http        = 80
    https       = 443
    ssh         = 22
    postgresql  = 5432
    redis       = 6379
    backend_api = 5000
    frontend    = 3000
  }
}