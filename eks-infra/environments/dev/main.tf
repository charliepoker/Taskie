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
