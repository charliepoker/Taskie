# VPC-specific local values
locals {
  # Common tags for VPC resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "VPC"
  }

  # Naming conventions for VPC resources
  name_prefix = "${var.project_name}-${var.environment}"

  vpc_name = "${local.name_prefix}-vpc"
  igw_name = "${local.name_prefix}-igw"

  # Subnet naming patterns
  public_subnet_names  = [for i, cidr in var.public_subnet_cidrs : "${local.name_prefix}-public-${i + 1}"]
  private_subnet_names = [for i, cidr in var.private_subnet_cidrs : "${local.name_prefix}-private-${i + 1}"]

  # NAT Gateway naming
  nat_gateway_names = [for i in range(length(var.public_subnet_cidrs)) : "${local.name_prefix}-nat-${i + 1}"]
  nat_eip_names     = [for i in range(length(var.public_subnet_cidrs)) : "${local.name_prefix}-nat-eip-${i + 1}"]

  # Route table naming
  public_rt_name   = "${local.name_prefix}-public-rt"
  private_rt_names = [for i in range(length(var.private_subnet_cidrs)) : "${local.name_prefix}-private-rt-${i + 1}"]
}
