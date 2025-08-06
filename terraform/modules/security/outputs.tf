# Security Group Outputs
output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web.id
}

output "web_security_group_arn" {
  description = "ARN of the web tier security group"
  value       = aws_security_group.web.arn
}

output "app_security_group_id" {
  description = "ID of the application tier security group"
  value       = aws_security_group.app.id
}

output "app_security_group_arn" {
  description = "ARN of the application tier security group"
  value       = aws_security_group.app.arn
}

output "db_security_group_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.db.id
}

output "db_security_group_arn" {
  description = "ARN of the database tier security group"
  value       = aws_security_group.db.arn
}

output "internal_alb_security_group_id" {
  description = "ID of the internal ALB security group"
  value       = aws_security_group.internal_alb.id
}

output "internal_alb_security_group_arn" {
  description = "ARN of the internal ALB security group"
  value       = aws_security_group.internal_alb.arn
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

output "waf_web_acl_capacity" {
  description = "Web ACL capacity units (WCU) currently being used by this web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].capacity : null
}

# IAM Outputs
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# Security Group Rules Summary
output "security_groups_summary" {
  description = "Summary of all security groups created"
  value = {
    web = {
      id   = aws_security_group.web.id
      name = aws_security_group.web.name
      tier = "web"
    }
    app = {
      id   = aws_security_group.app.id
      name = aws_security_group.app.name
      tier = "application"
    }
    db = {
      id   = aws_security_group.db.id
      name = aws_security_group.db.name
      tier = "database"
    }
    internal_alb = {
      id   = aws_security_group.internal_alb.id
      name = aws_security_group.internal_alb.name
      tier = "internal-load-balancer"
    }
  }
}
