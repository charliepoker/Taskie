# Outputs for Compute Module

# Load Balancer Outputs
output "external_alb_id" {
  description = "ID of the external Application Load Balancer"
  value       = aws_lb.external.id
}

output "external_alb_arn" {
  description = "ARN of the external Application Load Balancer"
  value       = aws_lb.external.arn
}

output "external_alb_dns_name" {
  description = "DNS name of the external Application Load Balancer"
  value       = aws_lb.external.dns_name
}

output "external_alb_zone_id" {
  description = "Zone ID of the external Application Load Balancer"
  value       = aws_lb.external.zone_id
}

output "internal_alb_id" {
  description = "ID of the internal Application Load Balancer"
  value       = aws_lb.internal.id
}

output "internal_alb_arn" {
  description = "ARN of the internal Application Load Balancer"
  value       = aws_lb.internal.arn
}

output "internal_alb_dns_name" {
  description = "DNS name of the internal Application Load Balancer"
  value       = aws_lb.internal.dns_name
}

output "internal_alb_zone_id" {
  description = "Zone ID of the internal Application Load Balancer"
  value       = aws_lb.internal.zone_id
}

# Target Group Outputs
output "frontend_target_group_id" {
  description = "ID of the frontend target group"
  value       = aws_lb_target_group.frontend.id
}

output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

output "frontend_target_group_name" {
  description = "Name of the frontend target group"
  value       = aws_lb_target_group.frontend.name
}

output "backend_target_group_id" {
  description = "ID of the backend target group"
  value       = aws_lb_target_group.backend.id
}

output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

output "backend_target_group_name" {
  description = "Name of the backend target group"
  value       = aws_lb_target_group.backend.name
}

# Listener Outputs
output "external_https_listener_arn" {
  description = "ARN of the external HTTPS listener"
  value       = var.enable_https ? aws_lb_listener.external_https[0].arn : null
}

output "external_http_listener_arn" {
  description = "ARN of the external HTTP listener"
  value       = aws_lb_listener.external_http.arn
}

output "internal_listener_arn" {
  description = "ARN of the internal load balancer listener"
  value       = aws_lb_listener.internal.arn
}

# Launch Template Outputs
output "frontend_launch_template_id" {
  description = "ID of the frontend launch template"
  value       = aws_launch_template.frontend.id
}

output "frontend_launch_template_arn" {
  description = "ARN of the frontend launch template"
  value       = aws_launch_template.frontend.arn
}

output "frontend_launch_template_name" {
  description = "Name of the frontend launch template"
  value       = aws_launch_template.frontend.name
}

output "frontend_launch_template_latest_version" {
  description = "Latest version of the frontend launch template"
  value       = aws_launch_template.frontend.latest_version
}

output "backend_launch_template_id" {
  description = "ID of the backend launch template"
  value       = aws_launch_template.backend.id
}

output "backend_launch_template_arn" {
  description = "ARN of the backend launch template"
  value       = aws_launch_template.backend.arn
}

output "backend_launch_template_name" {
  description = "Name of the backend launch template"
  value       = aws_launch_template.backend.name
}

output "backend_launch_template_latest_version" {
  description = "Latest version of the backend launch template"
  value       = aws_launch_template.backend.latest_version
}

# Auto Scaling Group Outputs
output "frontend_asg_id" {
  description = "ID of the frontend Auto Scaling Group"
  value       = aws_autoscaling_group.frontend.id
}

output "frontend_asg_arn" {
  description = "ARN of the frontend Auto Scaling Group"
  value       = aws_autoscaling_group.frontend.arn
}

output "frontend_asg_name" {
  description = "Name of the frontend Auto Scaling Group"
  value       = aws_autoscaling_group.frontend.name
}

output "backend_asg_id" {
  description = "ID of the backend Auto Scaling Group"
  value       = aws_autoscaling_group.backend.id
}

output "backend_asg_arn" {
  description = "ARN of the backend Auto Scaling Group"
  value       = aws_autoscaling_group.backend.arn
}

output "backend_asg_name" {
  description = "Name of the backend Auto Scaling Group"
  value       = aws_autoscaling_group.backend.name
}

# Auto Scaling Policy Outputs
output "frontend_scale_up_policy_arn" {
  description = "ARN of the frontend scale up policy"
  value       = aws_autoscaling_policy.frontend_scale_up.arn
}

output "frontend_scale_down_policy_arn" {
  description = "ARN of the frontend scale down policy"
  value       = aws_autoscaling_policy.frontend_scale_down.arn
}

output "backend_scale_up_policy_arn" {
  description = "ARN of the backend scale up policy"
  value       = aws_autoscaling_policy.backend_scale_up.arn
}

output "backend_scale_down_policy_arn" {
  description = "ARN of the backend scale down policy"
  value       = aws_autoscaling_policy.backend_scale_down.arn
}

# CloudWatch Alarm Outputs
output "frontend_cpu_high_alarm_arn" {
  description = "ARN of the frontend CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.frontend_cpu_high.arn
}

output "frontend_cpu_low_alarm_arn" {
  description = "ARN of the frontend CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.frontend_cpu_low.arn
}

output "backend_cpu_high_alarm_arn" {
  description = "ARN of the backend CPU high alarm"
  value       = aws_cloudwatch_metric_alarm.backend_cpu_high.arn
}

output "backend_cpu_low_alarm_arn" {
  description = "ARN of the backend CPU low alarm"
  value       = aws_cloudwatch_metric_alarm.backend_cpu_low.arn
}

# Summary Outputs
output "load_balancers_summary" {
  description = "Summary of all load balancers created"
  value = {
    external = {
      id       = aws_lb.external.id
      dns_name = aws_lb.external.dns_name
      zone_id  = aws_lb.external.zone_id
      type     = "external"
    }
    internal = {
      id       = aws_lb.internal.id
      dns_name = aws_lb.internal.dns_name
      zone_id  = aws_lb.internal.zone_id
      type     = "internal"
    }
  }
}

output "auto_scaling_groups_summary" {
  description = "Summary of all Auto Scaling Groups created"
  value = {
    frontend = {
      id               = aws_autoscaling_group.frontend.id
      name             = aws_autoscaling_group.frontend.name
      min_size         = aws_autoscaling_group.frontend.min_size
      max_size         = aws_autoscaling_group.frontend.max_size
      desired_capacity = aws_autoscaling_group.frontend.desired_capacity
      tier             = "web"
    }
    backend = {
      id               = aws_autoscaling_group.backend.id
      name             = aws_autoscaling_group.backend.name
      min_size         = aws_autoscaling_group.backend.min_size
      max_size         = aws_autoscaling_group.backend.max_size
      desired_capacity = aws_autoscaling_group.backend.desired_capacity
      tier             = "application"
    }
  }
}

output "target_groups_summary" {
  description = "Summary of all target groups created"
  value = {
    frontend = {
      id   = aws_lb_target_group.frontend.id
      name = aws_lb_target_group.frontend.name
      port = aws_lb_target_group.frontend.port
      tier = "web"
    }
    backend = {
      id   = aws_lb_target_group.backend.id
      name = aws_lb_target_group.backend.name
      port = aws_lb_target_group.backend.port
      tier = "application"
    }
  }
}

# Application URLs
output "application_url" {
  description = "URL to access the application"
  value       = var.enable_https ? "https://${aws_lb.external.dns_name}" : "http://${aws_lb.external.dns_name}"
}

output "internal_backend_url" {
  description = "Internal URL for backend communication"
  value       = "http://${aws_lb.internal.dns_name}"
}
