# Security Module

This module creates security-related resources for a 3-tier web application architecture, including security groups, WAF protection, and IAM roles for EC2 instances.

## Features

- **Security Groups**: Creates security groups for web, application, database, and internal load balancer tiers
- **WAF Protection**: Optional AWS WAF Web ACL with managed rule sets and rate limiting
- **IAM Roles**: EC2 instance roles with appropriate permissions for logging, S3 access, and SSM parameters
- **Least Privilege**: Implements security best practices with minimal required permissions

## Architecture

The module creates security groups following the 3-tier architecture pattern:

```
Internet → Web SG (ALB) → App SG (EC2) → DB SG (RDS/Redis)
                     ↓
              Internal ALB SG
```

## Usage

### Basic Usage

```hcl
module "security" {
  source = "./modules/security"

  name_prefix = "taskie-dev"
  vpc_id      = module.networking.vpc_id

  tags = {
    Environment = "dev"
    Project     = "taskie"
  }
}
```

### Advanced Usage with Custom Configuration

```hcl
module "security" {
  source = "./modules/security"

  name_prefix            = "taskie-prod"
  vpc_id                = module.networking.vpc_id
  allowed_cidr_blocks   = ["10.0.0.0/8", "172.16.0.0/12"]
  app_port              = 3000
  enable_ssh_access     = true
  ssh_allowed_cidr_blocks = ["10.0.0.0/16"]
  enable_waf            = true
  waf_rate_limit        = 5000
  s3_bucket_arns        = [
    "arn:aws:s3:::taskie-logs-bucket/*",
    "arn:aws:s3:::taskie-static-assets/*"
  ]

  tags = {
    Environment = "prod"
    Project     = "taskie"
    Owner       = "devops-team"
  }
}
```

## Security Groups

### Web Tier Security Group

- **Purpose**: Protects the external Application Load Balancer
- **Inbound**: HTTP (80) and HTTPS (443) from specified CIDR blocks
- **Outbound**: All traffic allowed

### Application Tier Security Group

- **Purpose**: Protects EC2 instances running the application
- **Inbound**: HTTP, HTTPS, and custom app port from web tier; optional SSH access
- **Outbound**: All traffic allowed

### Database Tier Security Group

- **Purpose**: Protects RDS and ElastiCache instances
- **Inbound**: PostgreSQL (5432) and Redis (6379) from application tier only
- **Outbound**: No outbound traffic allowed

### Internal ALB Security Group

- **Purpose**: Protects internal load balancers for backend services
- **Inbound**: HTTP and HTTPS from application tier
- **Outbound**: All traffic allowed

## WAF Configuration

The optional WAF Web ACL includes:

- **AWS Managed Core Rule Set**: Protection against OWASP Top 10 vulnerabilities
- **Known Bad Inputs Rule Set**: Blocks requests with known malicious patterns
- **Rate Limiting**: Configurable rate limiting per IP address
- **CloudWatch Integration**: Metrics and logging enabled

## IAM Roles and Policies

### EC2 Role Permissions

The EC2 instance role includes permissions for:

- **CloudWatch Logs**: Create log groups, streams, and put log events
- **S3 Access**: Get and put objects in specified buckets
- **SSM Parameters**: Read application configuration from Parameter Store

## Requirements

| Name      | Version |
| --------- | ------- |
| terraform | >= 1.0  |
| aws       | >= 5.0  |

## Providers

| Name | Version |
| ---- | ------- |
| aws  | >= 5.0  |

## Inputs

| Name                    | Description                                                     | Type           | Default         | Required |
| ----------------------- | --------------------------------------------------------------- | -------------- | --------------- | :------: |
| name_prefix             | Prefix for naming resources                                     | `string`       | n/a             |   yes    |
| vpc_id                  | ID of the VPC where security groups will be created             | `string`       | n/a             |   yes    |
| allowed_cidr_blocks     | List of CIDR blocks allowed to access the web tier              | `list(string)` | `["0.0.0.0/0"]` |    no    |
| app_port                | Port number for the application                                 | `number`       | `3000`          |    no    |
| enable_ssh_access       | Whether to enable SSH access to application instances           | `bool`         | `false`         |    no    |
| ssh_allowed_cidr_blocks | List of CIDR blocks allowed SSH access to application instances | `list(string)` | `[]`            |    no    |
| enable_waf              | Whether to create a WAF Web ACL                                 | `bool`         | `true`          |    no    |
| waf_rate_limit          | Rate limit for WAF (requests per 5-minute period)               | `number`       | `2000`          |    no    |
| s3_bucket_arns          | List of S3 bucket ARNs that EC2 instances need access to        | `list(string)` | `[]`            |    no    |
| tags                    | A map of tags to assign to resources                            | `map(string)`  | `{}`            |    no    |

## Outputs

| Name                            | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| web_security_group_id           | ID of the web tier security group                 |
| web_security_group_arn          | ARN of the web tier security group                |
| app_security_group_id           | ID of the application tier security group         |
| app_security_group_arn          | ARN of the application tier security group        |
| db_security_group_id            | ID of the database tier security group            |
| db_security_group_arn           | ARN of the database tier security group           |
| internal_alb_security_group_id  | ID of the internal ALB security group             |
| internal_alb_security_group_arn | ARN of the internal ALB security group            |
| waf_web_acl_id                  | ID of the WAF Web ACL                             |
| waf_web_acl_arn                 | ARN of the WAF Web ACL                            |
| waf_web_acl_capacity            | Web ACL capacity units (WCU) currently being used |
| ec2_role_arn                    | ARN of the EC2 IAM role                           |
| ec2_role_name                   | Name of the EC2 IAM role                          |
| ec2_instance_profile_arn        | ARN of the EC2 instance profile                   |
| ec2_instance_profile_name       | Name of the EC2 instance profile                  |
| security_groups_summary         | Summary of all security groups created            |

## Security Best Practices

This module implements several security best practices:

1. **Least Privilege Access**: Security groups only allow necessary traffic between tiers
2. **Defense in Depth**: Multiple layers of security (WAF, security groups, IAM)
3. **Network Segmentation**: Clear separation between web, app, and database tiers
4. **Encryption in Transit**: HTTPS/TLS support throughout the architecture
5. **Monitoring**: CloudWatch integration for WAF and security group monitoring
6. **Input Validation**: Comprehensive variable validation to prevent misconfigurations

## Examples

### Development Environment

```hcl
module "security" {
  source = "./modules/security"

  name_prefix         = "taskie-dev"
  vpc_id             = "vpc-12345678"
  enable_ssh_access  = true
  ssh_allowed_cidr_blocks = ["10.0.0.0/16"]
  enable_waf         = false  # Disable WAF for cost savings in dev

  tags = {
    Environment = "development"
    Project     = "taskie"
  }
}
```

### Production Environment

```hcl
module "security" {
  source = "./modules/security"

  name_prefix            = "taskie-prod"
  vpc_id                = "vpc-87654321"
  allowed_cidr_blocks   = ["0.0.0.0/0"]
  enable_ssh_access     = false  # No SSH in production
  enable_waf            = true
  waf_rate_limit        = 10000
  s3_bucket_arns        = [
    "arn:aws:s3:::taskie-prod-logs/*",
    "arn:aws:s3:::taskie-prod-assets/*"
  ]

  tags = {
    Environment = "production"
    Project     = "taskie"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }
}
```

## Migration Notes

When migrating from a monolithic Terraform structure:

1. Import existing security groups using `terraform import`
2. Update security group references in other modules
3. Ensure IAM roles have the same permissions as existing roles
4. Test WAF rules in a staging environment before production deployment

## Troubleshooting

### Common Issues

1. **Security Group Dependency Cycles**: Ensure proper dependency ordering between modules
2. **WAF Rate Limiting**: Adjust rate limits based on application traffic patterns
3. **IAM Permission Errors**: Verify S3 bucket ARNs and SSM parameter paths are correct
4. **SSH Access**: Ensure SSH key pairs exist before enabling SSH access

### Validation Commands

```bash
# Validate the module
terraform validate

# Plan with example variables
terraform plan -var="name_prefix=test" -var="vpc_id=vpc-12345678"

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-12345678
```
