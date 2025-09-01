module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "eks-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = [var.private_subnet_cidrs[0], var.private_subnet_cidrs[1]]
  public_subnets  = [var.public_subnet_cidrs[0], var.public_subnet_cidrs[1]]

  enable_nat_gateway     = true
  single_nat_gateway     = false # For high availability, using multiple NAT gateways
  one_nat_gateway_per_az = true
  enable_vpn_gateway     = false

  database_subnets             = [var.database_subnet_cidrs[0], var.database_subnet_cidrs[1]]
  create_database_subnet_group = true

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

  # VPC Configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # EKS Managed Node Groups (correct syntax for v19.x)
  eks_managed_node_groups = {
    main = {
      instance_types = var.node_groups["main"].instance_types
      min_size       = var.node_groups["main"].min_size
      max_size       = var.node_groups["main"].max_size
      desired_size   = var.node_groups["main"].desired_size

      labels = {
        Environment = var.environment
        Role        = "main"
      }

      tags = {
        Environment                                 = var.environment
        Terraform                                   = "true"
        "kubernetes.io/cluster/${var.cluster_name}" = "owned"
      }
    }
  }

  # Enable cluster add-ons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  # Enable OIDC provider for the cluster
  enable_irsa = true

  tags = {
    Environment = var.environment
    Terraform   = "true"
  }
}

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.1.1"

  identifier = "taskie-${var.environment}-postgres"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t3.medium"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "taskietaskie"
  username = var.db_username
  password = var.db_password
  port     = 5432

  multi_az               = false
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  create_monitoring_role                = true
  monitoring_interval                   = 60

  parameters = [
    {
      name  = "autovacuum"
      value = 1
    },
    {
      name  = "client_encoding"
      value = "utf8"
    }
  ]

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
  }
}

# Security group for RDS
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

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
  }
}

# Redis ElastiCache cluster using direct AWS resources
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "taskie-${var.environment}-redis"
  description          = "Redis cluster for Taskie ${var.environment}"

  engine             = "redis"
  engine_version     = "7.0"
  port               = 6379
  node_type          = "cache.t3.micro"
  num_cache_clusters = 1

  parameter_group_name = "default.redis7.x"

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "mon:04:00-mon:05:00"

  automatic_failover_enabled = false
  multi_az_enabled           = false

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
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

# Security group for Redis
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

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "taskie"
  }
}
