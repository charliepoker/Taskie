module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "eks-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a", "${var.aws_region}b", ]
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
  version = "19.16.0"

  cluster_name                         = var.cluster_name
  cluster_version                      = var.kubernetes_version
  cluster_endpoint_public_access       = var.cluster_endpoint_public_access
  cluster_endpoint_private_access      = var.cluster_endpoint_private_access
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  # VPC Configuration
  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  # EKS Managed Node Groups
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

  # Enable EKS add-ons
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

  # Security group rules
  cluster_security_group_additional_rules = {
    egress_nodes_ephemeral_ports_tcp = {
      description                = "To node 1025-65535"
      protocol                   = "tcp"
      from_port                  = 1025
      to_port                    = 65535
      type                       = "egress"
      source_node_security_group = true
    }
  }

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

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
  engine_version       = "17.4"
  family               = "postgres17"
  major_engine_version = "17"
  instance_class       = "db.t3.medium"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "taskiedb"
  username = var.db_username
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