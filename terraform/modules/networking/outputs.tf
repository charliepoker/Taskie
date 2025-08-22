# Outputs for Networking Module

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

# Internet Gateway Outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# Public Subnet Outputs
output "public_subnet_ids" {
  description = "List of IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "public_subnet_arns" {
  description = "List of ARNs of the public subnets"
  value       = aws_subnet.public[*].arn
}

output "public_subnet_cidr_blocks" {
  description = "List of CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "public_subnet_availability_zones" {
  description = "List of availability zones of the public subnets"
  value       = aws_subnet.public[*].availability_zone
}

# Private Subnet Outputs
output "private_subnet_ids" {
  description = "List of IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "private_subnet_arns" {
  description = "List of ARNs of the private subnets"
  value       = aws_subnet.private[*].arn
}

output "private_subnet_cidr_blocks" {
  description = "List of CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "private_subnet_availability_zones" {
  description = "List of availability zones of the private subnets"
  value       = aws_subnet.private[*].availability_zone
}

# Database Subnet Outputs
output "database_subnet_ids" {
  description = "List of IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "database_subnet_arns" {
  description = "List of ARNs of the database subnets"
  value       = aws_subnet.database[*].arn
}

output "database_subnet_cidr_blocks" {
  description = "List of CIDR blocks of the database subnets"
  value       = aws_subnet.database[*].cidr_block
}

output "database_subnet_availability_zones" {
  description = "List of availability zones of the database subnets"
  value       = aws_subnet.database[*].availability_zone
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "List of IDs of the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[*].id : []
}

output "nat_gateway_public_ips" {
  description = "List of public Elastic IP addresses associated with the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_eip.nat[*].public_ip : []
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "ID of the database route table"
  value       = aws_route_table.database.id
}

# Availability Zone Outputs
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# Flow Logs Outputs
output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = var.enable_flow_logs ? aws_flow_log.vpc[0].id : null
}

output "vpc_flow_log_cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group for VPC Flow Logs"
  value       = var.enable_flow_logs ? aws_cloudwatch_log_group.vpc_flow_log[0].name : null
}

# Subnet Group Information for RDS
output "database_subnet_group_name" {
  description = "Name that can be used for RDS subnet group (derived from database subnets)"
  value       = "${var.name_prefix}-database-subnet-group"
}

# Network ACL Default ID (for reference)
output "default_network_acl_id" {
  description = "ID of the default network ACL"
  value       = aws_vpc.main.default_network_acl_id
}

# Security Group Default ID (for reference)
output "default_security_group_id" {
  description = "ID of the default security group"
  value       = aws_vpc.main.default_security_group_id
}

# DHCP Options Set ID (for reference)
output "dhcp_options_id" {
  description = "ID of the DHCP options set"
  value       = aws_vpc.main.dhcp_options_id
}

# Main Route Table ID (for reference)
output "main_route_table_id" {
  description = "ID of the main route table"
  value       = aws_vpc.main.main_route_table_id
}
