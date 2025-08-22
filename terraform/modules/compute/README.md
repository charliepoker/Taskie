# Compute Module

This Terraform module creates the compute infrastructure for the Taskie application, including Application Load Balancers, Auto Scaling Groups, Launch Templates, and associated resources for both frontend and backend tiers.

## Architecture

The module implements a highly available, scalable compute architecture with:

- **External Application Load Balancer**: Internet-facing ALB for frontend traffic
- **Internal Application Load Balancer**: Internal ALB for backend communication
- **Auto Scaling Groups**: Separate ASGs for frontend and backend with automatic scaling
- **Launch Templates**: Configurable templates for EC2 instances with user data scripts
- **Target Groups**: Health-checked target groups for load balancer routing
- **CloudWatch Monitoring**: CPU-based auto scaling with CloudWatch alarms

## Resources Created

### Load Balancers

- External Application Load Balancer (internet-facing)
- Internal Application Load Balancer (internal)
- Target groups for frontend and backend services
- HTTP/HTTPS listeners with SSL termination support

### Auto Scaling

- Frontend Auto Scaling Group with configurable capacity
- Backend Auto Scaling Group with configurable capacity
- Launch templates with security hardening and monitoring
- Auto scaling policies based on CPU utilization
- CloudWatch alarms for scaling triggers

### Security Features

- IMDSv2 enforcement on EC2 instances
- EBS encryption enabled by default
- Security group integration from security module
- IAM instance profiles for AWS service access

## Usage

```hcl
module "compute" {
  source = "./modules/compute"

  # General Configuration
  name_prefix = "taskie-prod"
  tags = {
    Environment = "production"
    Project     = "taskie"
  }

  # Network Configuration
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids

  # Security Groups
  web_security_group_id         = module.security.web_security_group_id
  app_security_group_id         = module.security.app_security_group_id
  internal_alb_security_group_id = module.security.internal_alb_security_group_id

  # IAM Configuration
  ec2_instance_profile_name = module.security.ec2_instance_profile_name

  # SSL Configuration
  enable_https    = true
  certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

  # Instance Configuration
  frontend_instance_type = "t3.small"
  backend_instance_type  = "t3.medium"
  key_name              = "my-key-pair"

  # Auto Scaling Configuration
  frontend_min_size         = 2
  frontend_max_size         = 6
  frontend_desired_capacity = 2

  backend_min_size         = 2
  backend_max_size         = 8
  backend_desired_capacity = 3

  # Database Configuration
  database_url = "postgresql://user:pass@db.example.com:5432/taskie"
  redis_url    = "redis://cache.example.com:6379"

  # Monitoring
  enable_detailed_monitoring = true
  enable_asg_metrics        = true
}
```

## Input Variables

### Required Variables

| Name                             | Description                                                         | Type           |
| -------------------------------- | ------------------------------------------------------------------- | -------------- |
| `name_prefix`                    | Prefix for resource names                                           | `string`       |
| `vpc_id`                         | ID of the VPC where resources will be created                       | `string`       |
| `public_subnet_ids`              | List of public subnet IDs for external load balancer                | `list(string)` |
| `private_subnet_ids`             | List of private subnet IDs for instances and internal load balancer | `list(string)` |
| `web_security_group_id`          | Security group ID for external load balancer                        | `string`       |
| `app_security_group_id`          | Security group ID for application instances                         | `string`       |
| `internal_alb_security_group_id` | Security group ID for internal load balancer                        | `string`       |
| `ec2_instance_profile_name`      | Name of the IAM instance profile for EC2 instances                  | `string`       |

### Optional Variables

| Name                         | Description                                     | Type          | Default      |
| ---------------------------- | ----------------------------------------------- | ------------- | ------------ |
| `tags`                       | A map of tags to assign to the resources        | `map(string)` | `{}`         |
| `enable_https`               | Enable HTTPS listener on external load balancer | `bool`        | `false`      |
| `certificate_arn`            | ARN of the SSL certificate for HTTPS listener   | `string`      | `""`         |
| `frontend_instance_type`     | Instance type for frontend instances            | `string`      | `"t3.micro"` |
| `backend_instance_type`      | Instance type for backend instances             | `string`      | `"t3.small"` |
| `frontend_min_size`          | Minimum number of frontend instances            | `number`      | `1`          |
| `frontend_max_size`          | Maximum number of frontend instances            | `number`      | `3`          |
| `frontend_desired_capacity`  | Desired number of frontend instances            | `number`      | `2`          |
| `backend_min_size`           | Minimum number of backend instances             | `number`      | `1`          |
| `backend_max_size`           | Maximum number of backend instances             | `number`      | `5`          |
| `backend_desired_capacity`   | Desired number of backend instances             | `number`      | `2`          |
| `enable_detailed_monitoring` | Enable detailed monitoring for EC2 instances    | `bool`        | `false`      |
| `enable_asg_metrics`         | Enable Auto Scaling Group metrics               | `bool`        | `true`       |
| `cpu_high_threshold`         | CPU utilization threshold for scaling up        | `number`      | `70`         |
| `cpu_low_threshold`          | CPU utilization threshold for scaling down      | `number`      | `20`         |

## Outputs

### Load Balancer Outputs

| Name                    | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `external_alb_dns_name` | DNS name of the external Application Load Balancer |
| `external_alb_zone_id`  | Zone ID of the external Application Load Balancer  |
| `internal_alb_dns_name` | DNS name of the internal Application Load Balancer |
| `application_url`       | URL to access the application                      |

### Auto Scaling Group Outputs

| Name                          | Description                                |
| ----------------------------- | ------------------------------------------ |
| `frontend_asg_name`           | Name of the frontend Auto Scaling Group    |
| `backend_asg_name`            | Name of the backend Auto Scaling Group     |
| `auto_scaling_groups_summary` | Summary of all Auto Scaling Groups created |

### Target Group Outputs

| Name                        | Description                          |
| --------------------------- | ------------------------------------ |
| `frontend_target_group_arn` | ARN of the frontend target group     |
| `backend_target_group_arn`  | ARN of the backend target group      |
| `target_groups_summary`     | Summary of all target groups created |

## Health Checks

The module configures comprehensive health checks:

- **Target Group Health Checks**: HTTP health checks on application endpoints
- **Auto Scaling Health Checks**: ELB health checks for instance replacement
- **CloudWatch Monitoring**: CPU, memory, and disk metrics collection

### Health Check Endpoints

- **Frontend**: `/` (root path)
- **Backend**: `/health` (dedicated health endpoint)

## Auto Scaling

Auto scaling is configured with:

- **CPU-based scaling**: Scale up at 70% CPU, scale down at 20% CPU
- **Cooldown periods**: 5-minute cooldown between scaling actions
- **Rolling updates**: Instance refresh with 50% minimum healthy percentage
- **CloudWatch alarms**: Automatic triggering of scaling policies

## Security Features

- **IMDSv2 Enforcement**: All instances require IMDSv2 for metadata access
- **EBS Encryption**: All volumes encrypted by default
- **Security Groups**: Proper network segmentation using security module
- **IAM Roles**: Least privilege access through instance profiles

## User Data Scripts

The module includes user data scripts for both tiers:

- **Frontend Script**: Sets up Node.js application with health endpoints
- **Backend Script**: Configures API server with database connectivity
- **CloudWatch Agent**: Automatic metrics and log collection setup
- **Service Management**: Systemd service configuration for applications

## Dependencies

This module depends on:

- **Networking Module**: VPC and subnet configuration
- **Security Module**: Security groups and IAM roles
- **AWS Provider**: Version 5.0 or later

## Examples

### Basic Configuration

```hcl
module "compute" {
  source = "./modules/compute"

  name_prefix = "taskie-dev"
  vpc_id      = module.networking.vpc_id

  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids

  web_security_group_id         = module.security.web_security_group_id
  app_security_group_id         = module.security.app_security_group_id
  internal_alb_security_group_id = module.security.internal_alb_security_group_id

  ec2_instance_profile_name = module.security.ec2_instance_profile_name
}
```

### Production Configuration with HTTPS

```hcl
module "compute" {
  source = "./modules/compute"

  name_prefix = "taskie-prod"

  # Network Configuration
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  private_subnet_ids = module.networking.private_subnet_ids

  # Security Configuration
  web_security_group_id         = module.security.web_security_group_id
  app_security_group_id         = module.security.app_security_group_id
  internal_alb_security_group_id = module.security.internal_alb_security_group_id
  ec2_instance_profile_name     = module.security.ec2_instance_profile_name

  # SSL Configuration
  enable_https    = true
  certificate_arn = var.ssl_certificate_arn

  # Instance Configuration
  frontend_instance_type = "t3.medium"
  backend_instance_type  = "t3.large"
  key_name              = var.key_pair_name

  # Auto Scaling Configuration
  frontend_min_size         = 2
  frontend_max_size         = 10
  frontend_desired_capacity = 3

  backend_min_size         = 3
  backend_max_size         = 15
  backend_desired_capacity = 5

  # Database Configuration
  database_url = module.database.connection_string
  redis_url    = module.database.redis_endpoint

  # Monitoring
  enable_detailed_monitoring = true
  enable_access_logs        = true
  access_logs_bucket        = module.storage.logs_bucket_id

  tags = {
    Environment = "production"
    Project     = "taskie"
    Terraform   = "true"
  }
}
```

## Troubleshooting

### Common Issues

1. **Health Check Failures**

   - Verify security group rules allow health check traffic
   - Check application is listening on correct port
   - Ensure health check path returns 200 status

2. **Auto Scaling Issues**

   - Verify CloudWatch alarms are configured correctly
   - Check IAM permissions for Auto Scaling service
   - Review scaling policies and cooldown periods

3. **Load Balancer Issues**
   - Ensure subnets are in different availability zones
   - Verify security groups allow traffic on required ports
   - Check target group health status

### Debugging Commands

```bash
# Check Auto Scaling Group status
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names <asg-name>

# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# View CloudWatch alarms
aws cloudwatch describe-alarms --alarm-names <alarm-name>
```

## Version Requirements

- Terraform >= 1.0
- AWS Provider >= 5.0
- Amazon Linux 2 AMI (automatically selected)

## License

This module is part of the Taskie project infrastructure code.
