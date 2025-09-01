output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of database subnet IDs"
  value       = module.vpc.database_subnets
}

output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.db.db_instance_endpoint
}

output "db_instance_name" {
  description = "The database name"
  value       = module.db.db_instance_name
}

output "db_instance_port" {
  description = "The database port"
  value       = module.db.db_instance_port
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.replication_group_primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.replication_group_port
}

output "redis_security_group_id" {
  description = "Security group ID for Redis cluster"
  value       = aws_security_group.redis.id
}
