# Design Document

## Overview

This design outlines the refactoring of the Taskie application's Terraform infrastructure from a monolithic structure to a professional, modular architecture. The new structure will demonstrate enterprise-level Infrastructure as Code practices through proper module separation, multi-environment support, and comprehensive documentation.

## Architecture

### Directory Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf              # Environment-specific resource calls
│   │   ├── terraform.tfvars     # Dev environment variables
│   │   ├── backend.tf           # Dev state backend config
│   │   └── outputs.tf           # Dev environment outputs
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   ├── backend.tf
│   │   └── outputs.tf
│   └── prod/
│       ├── main.tf
│       ├── terraform.tfvars
│       ├── backend.tf
│       └── outputs.tf
├── modules/
│   ├── networking/              # VPC, subnets, routing
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── compute/                 # EC2, Auto Scaling, Load Balancers
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── database/                # RDS, ElastiCache
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── security/                # Security Groups, WAF, IAM
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── storage/                 # S3 buckets
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   └── dns/                     # Route53
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── README.md
├── bootstrap/
│   ├── main.tf                  # S3 bucket and DynamoDB for state
│   ├── variables.tf
│   └── outputs.tf
├── shared/
│   ├── locals.tf                # Common local values
│   ├── providers.tf             # Provider configurations
│   └── versions.tf              # Version constraints
└── README.md                    # Main documentation
```

### Module Design Principles

1. **Single Responsibility**: Each module handles one infrastructure concern
2. **Reusability**: Modules work across all environments without modification
3. **Composability**: Modules can be combined to build complete infrastructure
4. **Testability**: Each module can be tested independently

## Components and Interfaces

### Networking Module

**Purpose**: Manages VPC, subnets, NAT gateways, and routing

**Key Resources**:

- VPC with DNS support
- Public, private, and database subnets across multiple AZs
- Internet Gateway and NAT Gateway
- Route tables and associations

**Inputs**:

- `vpc_cidr`: VPC CIDR block
- `availability_zones`: List of AZs to use
- `public_subnet_cidrs`: Public subnet CIDR blocks
- `private_subnet_cidrs`: Private subnet CIDR blocks
- `database_subnet_cidrs`: Database subnet CIDR blocks
- `enable_nat_gateway`: Boolean for NAT gateway creation

**Outputs**:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs

### Security Module

**Purpose**: Manages security groups, WAF, and IAM roles

**Key Resources**:

- Security groups for web, app, and database tiers
- WAF web ACL for application protection
- IAM roles and policies for EC2 instances

**Inputs**:

- `vpc_id`: VPC to create security groups in
- `enable_waf`: Boolean for WAF creation
- `allowed_cidr_blocks`: CIDR blocks for access rules

**Outputs**:

- `web_security_group_id`: Web tier security group
- `app_security_group_id`: App tier security group
- `db_security_group_id`: Database security group
- `waf_web_acl_arn`: WAF web ACL ARN

### Compute Module

**Purpose**: Manages EC2 instances, Auto Scaling, and Load Balancers

**Key Resources**:

- Application Load Balancers (external and internal)
- Auto Scaling Groups for frontend and backend
- Launch templates with user data
- Target groups and listeners

**Inputs**:

- `vpc_id`: VPC for load balancers
- `public_subnet_ids`: Subnets for external ALB
- `private_subnet_ids`: Subnets for internal ALB and instances
- `security_group_ids`: Security groups for resources
- `instance_types`: Instance types for different tiers

**Outputs**:

- `external_alb_dns_name`: External load balancer DNS
- `internal_alb_dns_name`: Internal load balancer DNS
- `auto_scaling_group_arns`: ASG ARNs

### Database Module

**Purpose**: Manages RDS PostgreSQL and ElastiCache Redis

**Key Resources**:

- RDS PostgreSQL instance with Multi-AZ
- ElastiCache Redis cluster
- DB subnet groups
- Parameter groups for optimization

**Inputs**:

- `database_subnet_ids`: Subnets for database resources
- `security_group_ids`: Security groups for database access
- `db_instance_class`: RDS instance type
- `db_name`: Database name
- `enable_redis`: Boolean for Redis creation

**Outputs**:

- `rds_endpoint`: RDS connection endpoint
- `redis_endpoint`: Redis connection endpoint
- `db_subnet_group_name`: Database subnet group

### Storage Module

**Purpose**: Manages S3 buckets for logs and static assets

**Key Resources**:

- S3 bucket for application logs
- S3 bucket for static assets
- Bucket policies and lifecycle rules
- CloudFront distribution for static assets

**Inputs**:

- `logs_bucket_name`: Name for logs bucket
- `static_bucket_name`: Name for static assets bucket
- `enable_cloudfront`: Boolean for CloudFront creation

**Outputs**:

- `logs_bucket_id`: Logs bucket identifier
- `static_bucket_id`: Static assets bucket identifier
- `cloudfront_domain_name`: CloudFront distribution domain

### DNS Module

**Purpose**: Manages Route53 hosted zone and records

**Key Resources**:

- Route53 hosted zone
- A records for application endpoints
- Health checks for monitoring

**Inputs**:

- `zone_name`: Domain name for hosted zone
- `alb_dns_name`: Load balancer DNS for A record
- `alb_zone_id`: Load balancer zone ID

**Outputs**:

- `zone_id`: Route53 hosted zone ID
- `name_servers`: Zone name servers

## Data Models

### Environment Configuration

Each environment directory contains:

- `main.tf`: Module instantiations with environment-specific parameters
- `terraform.tfvars`: Variable values for the environment
- `backend.tf`: Remote state configuration
- `outputs.tf`: Environment-level outputs

### Module Interface

Each module follows a standard interface:

- `main.tf`: Resource definitions
- `variables.tf`: Input variable declarations with validation
- `outputs.tf`: Output value definitions
- `README.md`: Documentation and usage examples

### Shared Configuration

- `locals.tf`: Common values used across environments
- `providers.tf`: AWS provider configuration
- `versions.tf`: Terraform and provider version constraints

## Error Handling

### Module Validation

- Input variables include validation rules for CIDR blocks, instance types, and required values
- Conditional resource creation using count and for_each
- Proper dependency management between modules

### State Management

- Remote state backend with encryption
- State locking using DynamoDB
- Separate state files per environment

### Resource Dependencies

- Explicit dependencies between modules using outputs as inputs
- Proper resource ordering to prevent creation failures
- Graceful handling of optional resources

## Testing Strategy

### Module Testing

- Individual module validation using `terraform validate`
- Module testing with different input combinations
- Output verification for each module

### Environment Testing

- Environment-specific deployment testing
- Integration testing between modules
- Infrastructure validation using automated tests

### Documentation Testing

- README accuracy verification
- Example code validation
- Documentation completeness checks

### Migration Testing

- Comparison of old vs new infrastructure outputs
- Validation that all existing resources are represented
- Testing of deployment and destruction processes
