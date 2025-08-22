# Database Module Outputs

# RDS PostgreSQL Outputs
output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.postgresql.id
}

output "rds_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.postgresql.arn
}

output "rds_endpoint" {
  description = "RDS instance connection endpoint"
  value       = aws_db_instance.postgresql.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgresql.port
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.postgresql.db_name
}

output "rds_username" {
  description = "RDS instance master username"
  value       = aws_db_instance.postgresql.username
  sensitive   = true
}

output "rds_hosted_zone_id" {
  description = "RDS instance hosted zone ID"
  value       = aws_db_instance.postgresql.hosted_zone_id
}

output "rds_resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.postgresql.resource_id
}

output "rds_status" {
  description = "RDS instance status"
  value       = aws_db_instance.postgresql.status
}

output "rds_availability_zone" {
  description = "RDS instance availability zone"
  value       = aws_db_instance.postgresql.availability_zone
}

output "rds_multi_az" {
  description = "RDS instance Multi-AZ status"
  value       = aws_db_instance.postgresql.multi_az
}

output "rds_backup_retention_period" {
  description = "RDS backup retention period"
  value       = aws_db_instance.postgresql.backup_retention_period
}

output "rds_backup_window" {
  description = "RDS backup window"
  value       = aws_db_instance.postgresql.backup_window
}

output "rds_maintenance_window" {
  description = "RDS maintenance window"
  value       = aws_db_instance.postgresql.maintenance_window
}

# Database Connection Information
output "database_url" {
  description = "Database connection URL (without password)"
  value       = "postgresql://${aws_db_instance.postgresql.username}@${aws_db_instance.postgresql.endpoint}/${aws_db_instance.postgresql.db_name}"
  sensitive   = true
}

output "database_connection_info" {
  description = "Database connection information"
  value = {
    host     = split(":", aws_db_instance.postgresql.endpoint)[0]
    port     = aws_db_instance.postgresql.port
    database = aws_db_instance.postgresql.db_name
    username = aws_db_instance.postgresql.username
  }
  sensitive = true
}

# DB Subnet Group Outputs
output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_subnet_group_arn" {
  description = "ARN of the DB subnet group"
  value       = aws_db_subnet_group.main.arn
}

# DB Parameter Group Outputs
output "db_parameter_group_name" {
  description = "Name of the DB parameter group"
  value       = aws_db_parameter_group.postgresql.name
}

output "db_parameter_group_arn" {
  description = "ARN of the DB parameter group"
  value       = aws_db_parameter_group.postgresql.arn
}

# Redis ElastiCache Outputs (conditional)
output "redis_replication_group_id" {
  description = "ElastiCache Redis replication group ID"
  value       = var.enable_redis ? aws_elasticache_replication_group.redis[0].id : null
}

output "redis_replication_group_arn" {
  description = "ElastiCache Redis replication group ARN"
  value       = var.enable_redis ? aws_elasticache_replication_group.redis[0].arn : null
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = var.enable_redis ? aws_elasticache_replication_group.redis[0].primary_endpoint_address : null
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = var.enable_redis ? aws_elasticache_replication_group.redis[0].reader_endpoint_address : null
}

output "redis_port" {
  description = "Redis port"
  value       = var.enable_redis ? aws_elasticache_replication_group.redis[0].port : null
}

output "redis_configuration_endpoint" {
  description = "Redis configuration endpoint"
  value       = var.enable_redis ? aws_elasticache_replication_group.redis[0].configuration_endpoint_address : null
}

# Redis Connection Information
output "redis_url" {
  description = "Redis connection URL"
  value = var.enable_redis ? (
    var.redis_encryption_in_transit ?
    "rediss://${aws_elasticache_replication_group.redis[0].primary_endpoint_address}:${aws_elasticache_replication_group.redis[0].port}" :
    "redis://${aws_elasticache_replication_group.redis[0].primary_endpoint_address}:${aws_elasticache_replication_group.redis[0].port}"
  ) : null
  sensitive = true
}

output "redis_connection_info" {
  description = "Redis connection information"
  value = var.enable_redis ? {
    primary_endpoint   = aws_elasticache_replication_group.redis[0].primary_endpoint_address
    reader_endpoint    = aws_elasticache_replication_group.redis[0].reader_endpoint_address
    port               = aws_elasticache_replication_group.redis[0].port
    auth_token_enabled = var.redis_encryption_in_transit
  } : null
  sensitive = true
}

# ElastiCache Subnet Group Outputs
output "redis_subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = var.enable_redis ? aws_elasticache_subnet_group.redis[0].name : null
}

# ElastiCache Parameter Group Outputs
output "redis_parameter_group_name" {
  description = "Name of the ElastiCache parameter group"
  value       = var.enable_redis ? aws_elasticache_parameter_group.redis[0].name : null
}

# Monitoring Outputs
output "rds_enhanced_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring IAM role"
  value       = var.enable_enhanced_monitoring ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
}

output "redis_log_group_name" {
  description = "Name of the Redis CloudWatch log group"
  value       = var.enable_redis ? aws_cloudwatch_log_group.redis_slow[0].name : null
}

output "redis_log_group_arn" {
  description = "ARN of the Redis CloudWatch log group"
  value       = var.enable_redis ? aws_cloudwatch_log_group.redis_slow[0].arn : null
}

# Security Information
output "database_security_info" {
  description = "Database security configuration summary"
  value = {
    rds_encrypted              = aws_db_instance.postgresql.storage_encrypted
    rds_kms_key_id             = aws_db_instance.postgresql.kms_key_id
    redis_encrypted_at_rest    = var.enable_redis ? var.redis_encryption_at_rest : null
    redis_encrypted_in_transit = var.enable_redis ? var.redis_encryption_in_transit : null
    deletion_protection        = aws_db_instance.postgresql.deletion_protection
  }
}

# High Availability Information
output "database_ha_info" {
  description = "Database high availability configuration summary"
  value = {
    rds_multi_az             = aws_db_instance.postgresql.multi_az
    redis_multi_az           = var.enable_redis ? var.redis_multi_az : null
    redis_num_cache_nodes    = var.enable_redis ? var.redis_num_cache_nodes : null
    redis_automatic_failover = var.enable_redis ? (var.redis_multi_az && var.redis_num_cache_nodes > 1) : null
  }
}
