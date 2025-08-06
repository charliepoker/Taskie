# Networking Module

This Terraform module creates a comprehensive VPC networking infrastructure for the Taskie application, following AWS best practices for multi-tier architecture with high availability across multiple Availability Zones.

## Architecture Overview

The module creates:

- **VPC** with DNS support enabled
- **Public Subnets** for load balancers and NAT gateways
- **Private Subnets** for application servers (frontend/backend)
- **Database Subnets** for RDS and ElastiCache (isolated from internet)
- **Internet Gateway** for public internet access
- **NAT Gateways** for private subnet internet access (optional)
- **Route Tables** with appropriate routing rules
- **VPC Flow Logs** for network monitoring (optional)

## Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                           │
├─────────────────────────────────────────────────────────────────┤
│  AZ-1a                           │  AZ-1b                       │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Public Subnet               │  │  │ Public Subnet           │ │
│  │ 10.0.1.0/24                 │  │  │ 10.0.2.0/24             │ │
│  │ ┌─────────┐ ┌─────────────┐ │  │  │ ┌─────────────────────┐ │ │
│  │ │   ALB   │ │ NAT Gateway │ │  │  │ │    NAT Gateway      │ │ │
│  │ └─────────┘ └─────────────┘ │  │  │ └─────────────────────┘ │ │
│  └─────────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Private Subnet              │  │  │ Private Subnet          │ │
│  │ 10.0.3.0/24                 │  │  │ 10.0.4.0/24             │ │
│  │ ┌─────────┐ ┌─────────────┐ │  │  │ ┌─────────┐ ┌─────────┐ │ │
│  │ │Frontend │ │   Backend   │ │  │  │ │Frontend │ │ Backend │ │ │
│  │ │   ECS   │ │     ECS     │ │  │  │ │   ECS   │ │   ECS   │ │ │
│  │ └─────────┘ └─────────────┘ │  │  │ └─────────┘ └─────────┘ │ │
│  └─────────────────────────────┘  │  └─────────────────────────┘ │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Database Subnet             │  │  │ Database Subnet         │ │
│  │ 10.0.5.0/24                 │  │  │ 10.0.6.0/24             │ │
│  │ ┌─────────┐ ┌─────────────┐ │  │  │ ┌─────────┐ ┌─────────┐ │ │
│  │ │   RDS   │ │    Redis    │ │  │  │ │RDS Read │ │ Redis   │ │ │
│  │ │Primary  │ │   Cluster   │ │  │  │ │Replica  │ │ Replica │ │ │
│  │ └─────────┘ └─────────────┘ │  │  │ └─────────┘ └─────────┘ │ │
│  └─────────────────────────────┘  │  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Basic Usage

```hcl
module "networking" {
  source = "./modules/networking"

  name_prefix = "taskie-dev"
  environment = "dev"

  common_tags = {
    Environment = "dev"
    Project     = "taskie"
    Owner       = "devops-team"
  }
}
```

### Custom CIDR Blocks

```hcl
module "networking" {
  source = "./modules/networking"

  name_prefix = "taskie-prod"
  environment = "prod"

  vpc_cidr                = "10.1.0.0/16"
  public_subnet_cidrs     = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs    = ["10.1.3.0/24", "10.1.4.0/24"]
  database_subnet_cidrs   = ["10.1.5.0/24", "10.1.6.0/24"]

  enable_nat_gateway = true
  enable_flow_logs   = true

  common_tags = {
    Environment = "prod"
    Project     = "taskie"
    Owner       = "devops-team"
    CostCenter  = "engineering"
  }
}
```

### Development Environment (Cost Optimized)

```hcl
module "networking" {
  source = "./modules/networking"

  name_prefix = "taskie-dev"
  environment = "dev"

  # Single AZ for cost savings in dev
  public_subnet_cidrs   = ["10.0.1.0/24"]
  private_subnet_cidrs  = ["10.0.3.0/24"]
  database_subnet_cidrs = ["10.0.5.0/24", "10.0.6.0/24"] # Still need 2 for RDS

  enable_nat_gateway = false  # Cost savings - no internet for private subnets
  enable_flow_logs   = false  # Disable for dev environment

  common_tags = {
    Environment = "dev"
    Project     = "taskie"
  }
}
```

### Production Environment (High Availability)

```hcl
module "networking" {
  source = "./modules/networking"

  name_prefix = "taskie-prod"
  environment = "prod"

  # Multi-AZ setup for high availability
  public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.7.0/24"]
  private_subnet_cidrs  = ["10.0.3.0/24", "10.0.4.0/24", "10.0.8.0/24"]
  database_subnet_cidrs = ["10.0.5.0/24", "10.0.6.0/24", "10.0.9.0/24"]

  enable_nat_gateway         = true
  enable_flow_logs          = true
  flow_logs_retention_days  = 30

  common_tags = {
    Environment = "prod"
    Project     = "taskie"
    Owner       = "devops-team"
    Backup      = "required"
    Monitoring  = "critical"
  }
}
```

## Accessing Module Outputs

```hcl
# Reference VPC ID in other modules
resource "aws_security_group" "example" {
  vpc_id = module.networking.vpc_id
  # ... other configuration
}

# Reference subnet IDs for load balancer
resource "aws_lb" "main" {
  subnets = module.networking.public_subnet_ids
  # ... other configuration
}

# Reference private subnets for application servers
resource "aws_instance" "app" {
  count     = length(module.networking.private_subnet_ids)
  subnet_id = module.networking.private_subnet_ids[count.index]
  # ... other configuration
}
```

## Requirements

| Name      | Version |
| --------- | ------- |
| terraform | >= 1.0  |
| aws       | >= 4.0  |

## Providers

| Name | Version |
| ---- | ------- |
| aws  | >= 4.0  |

## Resources Created

| Resource Type               | Count    | Description                                     |
| --------------------------- | -------- | ----------------------------------------------- |
| aws_vpc                     | 1        | Main VPC with DNS support                       |
| aws_internet_gateway        | 1        | Internet gateway for public access              |
| aws_subnet                  | Variable | Public, private, and database subnets           |
| aws_nat_gateway             | Variable | NAT gateways for private subnet internet access |
| aws_eip                     | Variable | Elastic IPs for NAT gateways                    |
| aws_route_table             | Variable | Route tables for each subnet tier               |
| aws_route_table_association | Variable | Associates subnets with route tables            |
| aws_flow_log                | 0-1      | VPC flow logs (optional)                        |
| aws_cloudwatch_log_group    | 0-1      | Log group for flow logs (optional)              |
| aws_iam_role                | 0-1      | IAM role for flow logs (optional)               |
| aws_iam_role_policy         | 0-1      | IAM policy for flow logs (optional)             |

## Inputs

| Name                     | Description                              | Type           | Default                          | Required |
| ------------------------ | ---------------------------------------- | -------------- | -------------------------------- | :------: |
| name_prefix              | Prefix for resource names                | `string`       | n/a                              |   yes    |
| environment              | Environment name (dev, staging, prod)    | `string`       | n/a                              |   yes    |
| vpc_cidr                 | CIDR block for the VPC                   | `string`       | `"10.0.0.0/16"`                  |    no    |
| public_subnet_cidrs      | List of CIDR blocks for public subnets   | `list(string)` | `["10.0.1.0/24", "10.0.2.0/24"]` |    no    |
| private_subnet_cidrs     | List of CIDR blocks for private subnets  | `list(string)` | `["10.0.3.0/24", "10.0.4.0/24"]` |    no    |
| database_subnet_cidrs    | List of CIDR blocks for database subnets | `list(string)` | `["10.0.5.0/24", "10.0.6.0/24"]` |    no    |
| enable_nat_gateway       | Enable NAT Gateway for private subnets   | `bool`         | `true`                           |    no    |
| enable_flow_logs         | Enable VPC Flow Logs                     | `bool`         | `false`                          |    no    |
| flow_logs_retention_days | Number of days to retain VPC Flow Logs   | `number`       | `14`                             |    no    |
| common_tags              | Common tags to apply to all resources    | `map(string)`  | `{}`                             |    no    |

## Outputs

| Name                               | Description                                                          |
| ---------------------------------- | -------------------------------------------------------------------- |
| vpc_id                             | ID of the VPC                                                        |
| vpc_cidr_block                     | CIDR block of the VPC                                                |
| vpc_arn                            | ARN of the VPC                                                       |
| internet_gateway_id                | ID of the Internet Gateway                                           |
| public_subnet_ids                  | List of IDs of the public subnets                                    |
| public_subnet_arns                 | List of ARNs of the public subnets                                   |
| public_subnet_cidr_blocks          | List of CIDR blocks of the public subnets                            |
| public_subnet_availability_zones   | List of availability zones of the public subnets                     |
| private_subnet_ids                 | List of IDs of the private subnets                                   |
| private_subnet_arns                | List of ARNs of the private subnets                                  |
| private_subnet_cidr_blocks         | List of CIDR blocks of the private subnets                           |
| private_subnet_availability_zones  | List of availability zones of the private subnets                    |
| database_subnet_ids                | List of IDs of the database subnets                                  |
| database_subnet_arns               | List of ARNs of the database subnets                                 |
| database_subnet_cidr_blocks        | List of CIDR blocks of the database subnets                          |
| database_subnet_availability_zones | List of availability zones of the database subnets                   |
| nat_gateway_ids                    | List of IDs of the NAT Gateways                                      |
| nat_gateway_public_ips             | List of public Elastic IP addresses associated with the NAT Gateways |
| public_route_table_id              | ID of the public route table                                         |
| private_route_table_ids            | List of IDs of the private route tables                              |
| database_route_table_id            | ID of the database route table                                       |
| availability_zones                 | List of availability zones used                                      |
| database_subnet_group_name         | Name that can be used for RDS subnet group                           |

## Security Considerations

1. **Network Isolation**: Database subnets have no internet access and are isolated from public subnets
2. **NAT Gateway**: Private subnets use NAT Gateway for outbound internet access (can be disabled for cost savings)
3. **Flow Logs**: Optional VPC Flow Logs for network monitoring and security analysis
4. **Multi-AZ**: Subnets are distributed across multiple Availability Zones for high availability

## Cost Optimization

- **NAT Gateway**: Can be disabled in development environments to save costs
- **Flow Logs**: Can be disabled in non-production environments
- **Single AZ**: Development environments can use fewer subnets to reduce NAT Gateway costs

## Best Practices Implemented

1. **Consistent Naming**: All resources follow a consistent naming convention
2. **Comprehensive Tagging**: Support for common tags across all resources
3. **Variable Validation**: Input validation for CIDR blocks and other parameters
4. **Modular Design**: Reusable across different environments
5. **Documentation**: Comprehensive README with examples and explanations
6. **Output Completeness**: Extensive outputs for integration with other modules

## Integration with Other Modules

This networking module is designed to work seamlessly with other Taskie infrastructure modules:

- **Security Module**: Uses VPC ID and subnet IDs for security group creation
- **Compute Module**: Uses public subnets for load balancers and private subnets for instances
- **Database Module**: Uses database subnets for RDS and ElastiCache
- **Storage Module**: Can reference VPC for VPC endpoints (future enhancement)

## Troubleshooting

### Common Issues

1. **CIDR Overlap**: Ensure subnet CIDRs don't overlap and fit within the VPC CIDR
2. **AZ Availability**: Some regions have limited AZs; adjust subnet counts accordingly
3. **NAT Gateway Costs**: Remember that NAT Gateways incur hourly charges plus data transfer costs
4. **Flow Logs Permissions**: Ensure proper IAM permissions for flow logs if enabled

### Validation Commands

```bash
# Validate the module
terraform validate

# Plan with example variables
terraform plan -var="name_prefix=test" -var="environment=dev"

# Check for CIDR conflicts
terraform plan | grep -i cidr
```

## Contributing

When modifying this module:

1. Update variable validation rules as needed
2. Add new outputs for any new resources
3. Update this README with new features
4. Test with different variable combinations
5. Ensure backward compatibility

## License

This module is part of the Taskie project infrastructure code.
