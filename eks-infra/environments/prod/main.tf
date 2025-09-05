# Production EKS Infrastructure Configuration
# Enhanced for production workloads with high availability, security, and performance

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "eks-vpc-${var.environment}"
  cidr = var.vpc_cidr

  # Using 3 AZs for better availability
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  # High availability NAT configuration
  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true
  enable_vpn_gateway     = false

  # Database subnets across 3 AZs
  database_subnets             = var.database_subnet_cidrs
  create_database_subnet_group = true

  # Enhanced VPC features for production
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs for security monitoring
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  # Required tags for EKS
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = 1
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = 1
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Criticality = "high"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.21.0"

  cluster_name                         = var.cluster_name
  cluster_version                      = var.kubernetes_version
  cluster_endpoint_public_access       = var.cluster_endpoint_public_access
  cluster_endpoint_private_access      = var.cluster_endpoint_private_access
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  # Enhanced security configuration
  cluster_encryption_config = {
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }

  # VPC Configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Production-grade node groups
  eks_managed_node_groups = {
    main = {
      instance_types = var.node_groups["main"].instance_types
      min_size       = var.node_groups["main"].min_size
      max_size       = var.node_groups["main"].max_size
      desired_size   = var.node_groups["main"].desired_size
      capacity_type  = var.node_groups["main"].capacity_type
      disk_size      = var.node_groups["main"].disk_size

      # Enhanced configuration for production
      ami_type = "AL2_x86_64"

      # Spread across all AZs
      subnet_ids = module.vpc.private_subnets

      labels = {
        Environment = var.environment
        Role        = "main"
        NodeGroup   = "production-main"
      }

      taints = []

      tags = {
        Environment                                 = var.environment
        Terraform                                   = "true"
        "kubernetes.io/cluster/${var.cluster_name}" = "owned"
        Criticality                                 = "high"
      }
    }

    # Temporarily disabled spot node group - can be re-enabled later
    # spot = {
    #   instance_types = var.node_groups["spot"].instance_types
    #   min_size       = var.node_groups["spot"].min_size
    #   max_size       = var.node_groups["spot"].max_size
    #   desired_size   = var.node_groups["spot"].desired_size
    #   capacity_type  = var.node_groups["spot"].capacity_type
    #   disk_size      = var.node_groups["spot"].disk_size

    #   ami_type = "AL2_x86_64"

    #   # Spread across all AZs
    #   subnet_ids = module.vpc.private_subnets

    #   labels = {
    #     Environment = var.environment
    #     Role        = "spot"
    #     NodeGroup   = "production-spot"
    #   }

    #   taints = [
    #     {
    #       key    = "spot-instance"
    #       value  = "true"
    #       effect = "NO_SCHEDULE"
    #     }
    #   ]

    #   tags = {
    #     Environment                                 = var.environment
    #     Terraform                                   = "true"
    #     "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    #     Criticality                                 = "medium"
    #   }
    # }
  }

  # Enhanced cluster add-ons for production
  cluster_addons = {
    coredns = {
      most_recent = true
      configuration_values = jsonencode({
        computeType = "Fargate"
        resources = {
          limits = {
            cpu    = "0.25"
            memory = "256Mi"
          }
          requests = {
            cpu    = "0.25"
            memory = "256Mi"
          }
        }
      })
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
      configuration_values = jsonencode({
        env = {
          ENABLE_POD_ENI                    = "true"
          ENABLE_PREFIX_DELEGATION          = "true"
          POD_SECURITY_GROUP_ENFORCING_MODE = "standard"
        }
      })
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # Enable OIDC provider for the cluster
  enable_irsa = true

  # CloudWatch logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Criticality = "high"
  }
}

# KMS key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Purpose     = "eks-encryption"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-${var.environment}"
  target_key_id = aws_kms_key.eks.key_id
}

# Production RDS with Multi-AZ and enhanced features
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.1.1"

  identifier = "taskie-${var.environment}-postgres"

  engine               = "postgres"
  engine_version       = "15.8"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.r6g.large" # Production-grade instance

  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "taskietaskie"
  username = var.db_username
  password = var.db_password
  port     = 5432

  # High availability configuration
  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Enhanced backup and maintenance
  maintenance_window              = "Sun:03:00-Sun:04:00"
  backup_window                   = "02:00-03:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  backup_retention_period          = var.backup_retention_period
  skip_final_snapshot              = false
  final_snapshot_identifier_prefix = "taskie-${var.environment}-final-snapshot"
  deletion_protection              = var.enable_deletion_protection

  # Enhanced monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = var.performance_insights_retention_period
  performance_insights_kms_key_id       = aws_kms_key.rds.arn
  create_monitoring_role                = true
  monitoring_interval                   = 60

  # Production parameters
  parameters = [
    {
      name  = "autovacuum"
      value = 1
    },
    {
      name  = "client_encoding"
      value = "utf8"
    },
    {
      name  = "log_statement"
      value = "all"
    },
    {
      name  = "log_min_duration_statement"
      value = "1000" # Log queries taking more than 1 second
    },
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
  ]

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
    Criticality = "high"
  }
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "RDS encryption key for ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Purpose     = "rds-encryption"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment}"
  target_key_id = aws_kms_key.rds.key_id
}

# Read replica for production workload
resource "aws_db_instance" "read_replica" {
  identifier                 = "taskie-${var.environment}-postgres-read-replica"
  replicate_source_db        = module.db.db_instance_identifier
  instance_class             = "db.r6g.large"
  publicly_accessible        = false
  auto_minor_version_upgrade = false

  performance_insights_enabled          = true
  performance_insights_retention_period = var.performance_insights_retention_period
  performance_insights_kms_key_id       = aws_kms_key.rds.arn
  monitoring_interval                   = 60
  monitoring_role_arn                   = module.db.enhanced_monitoring_iam_role_arn

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
    Purpose     = "read-replica"
  }
}

# Enhanced security group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "taskie-${var.environment}-rds"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL access from EKS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
  }
}

# Production Redis cluster with replication
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "taskie-${var.environment}-redis"
  description          = "Redis cluster for Taskie ${var.environment}"

  engine             = "redis"
  engine_version     = "7.0"
  port               = 6379
  node_type          = "cache.r6g.large" # Production-grade instance
  num_cache_clusters = 3                 # 1 primary + 2 replicas

  parameter_group_name = aws_elasticache_parameter_group.redis.name

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  # Enhanced backup and maintenance
  snapshot_retention_limit = 14
  snapshot_window          = "02:00-03:00"
  maintenance_window       = "sun:03:00-sun:04:00"

  # High availability configuration
  automatic_failover_enabled = true
  multi_az_enabled           = true

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                 = aws_kms_key.redis.arn

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
    Criticality = "high"
  }
}

# KMS key for Redis encryption
resource "aws_kms_key" "redis" {
  description             = "Redis encryption key for ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Purpose     = "redis-encryption"
  }
}

resource "aws_kms_alias" "redis" {
  name          = "alias/redis-${var.environment}"
  target_key_id = aws_kms_key.redis.key_id
}

# Redis parameter group for production tuning
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "taskie-${var.environment}-redis-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
  }
}

# CloudWatch log group for Redis
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/redis/${var.environment}/slow-log"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Terraform   = "true"
  }
}

# Create subnet group for Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "taskie-${var.environment}-redis-subnet-group"
  subnet_ids = module.vpc.database_subnets

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
  }
}

# Enhanced security group for Redis
resource "aws_security_group" "redis" {
  name_prefix = "taskie-${var.environment}-redis"
  description = "Security group for Redis cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis access from EKS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
  }
}
