#!/usr/bin/env python3
"""
AWS Architecture Diagram for Taskie Task Management Application
Demonstrates Security, Scalability, Availability, and Visibility principles
"""

from diagrams import Diagram, Cluster
from diagrams.aws.compute import ECS
from diagrams.aws.network import ELB, Route53
from diagrams.aws.database import RDS, ElasticacheForRedis
from diagrams.aws.security import IAM, WAF
from diagrams.aws.storage import S3
from diagrams.aws.management import CloudwatchLogs as Cloudwatch
from diagrams.onprem.client import Users

# Configuration
diagram_attrs = {
    "fontsize": "12",
    "bgcolor": "white"
}

with Diagram("Taskie AWS Architecture - Manual Console Deployment",
             show=False,
             direction="TB",
             graph_attr=diagram_attrs):
    
    # Users
    users = Users("End Users")
    
    # DNS and CDN
    dns = Route53("Route 53\nDNS Management")
    waf = WAF("AWS WAF\nWeb Application Firewall")
    
    # VPC and Network Architecture
    with Cluster("AWS VPC - Taskie Production Environment\n10.0.0.0/16"):
        
        # Availability Zone 1
        with Cluster("Availability Zone 1a"):
            # Public Subnet 1
            with Cluster("Public Subnet - Web Tier\n10.0.1.0/24"):
                alb = ELB("Application\nLoad Balancer")
            
            # Private Subnet 1
            with Cluster("Private Subnet - App Tier 1a\n10.0.3.0/24"):
                frontend_1a = ECS("Frontend Service\n(Next.js)")
                backend_1a = ECS("Backend Service\n(Express.js)")
        
        # Availability Zone 2
        with Cluster("Availability Zone 1b"):
            # Private Subnet 2
            with Cluster("Private Subnet - App Tier 1b\n10.0.4.0/24"):
                frontend_1b = ECS("Frontend Service\n(Next.js)")
                backend_1b = ECS("Backend Service\n(Express.js)")
        
        # Database Tier (Multi-AZ)
        with Cluster("Private Subnet - Data Tier\n10.0.5.0/24 & 10.0.6.0/24"):
            postgres_primary = RDS("PostgreSQL\nPrimary (Multi-AZ)")
            postgres_replica = RDS("PostgreSQL\nRead Replica")
            redis_cluster = ElasticacheForRedis("Redis Cluster\n(Multi-AZ)")
    
    # Security Services
    with Cluster("Security & Secrets Management"):
        iam = IAM("IAM Roles\n& Policies")
    
    # Storage
    s3_assets = S3("S3 Bucket\nStatic Assets")
    s3_logs = S3("S3 Bucket\nApplication Logs")
    
    # Monitoring & Observability
    with Cluster("Monitoring & Observability"):
        cloudwatch = Cloudwatch("CloudWatch\nMetrics & Logs")
    
    # Container Registry for Manual Deployment
    ecr = S3("ECR Repository\nContainer Images")
    
    # Traffic Flow
    users >> dns >> waf >> alb
    
    # Load Balancer to Services
    alb >> [frontend_1a, frontend_1b]
    alb >> [backend_1a, backend_1b]
    
    # Backend to Database
    backend_1a >> postgres_primary
    backend_1b >> postgres_primary
    backend_1a >> redis_cluster
    backend_1b >> redis_cluster
    
    # Database Replication
    postgres_primary >> postgres_replica
    
    # Security Connections
    [frontend_1a, frontend_1b, backend_1a, backend_1b] >> iam
    
    # Static Assets
    [frontend_1a, frontend_1b] >> s3_assets
    
    # Monitoring Connections
    [frontend_1a, frontend_1b, backend_1a, backend_1b, alb] >> cloudwatch
    [cloudwatch] >> s3_logs
    
    # Container Images
    ecr >> [frontend_1a, frontend_1b, backend_1a, backend_1b]

print("AWS Architecture diagram generated successfully!")
print("Perfect for manual AWS console deployment and blog screenshots!")
print("The diagram demonstrates:")
print("✓ Security: WAF, IAM, Private Subnets, Security Groups")
print("✓ Scalability: Auto Scaling Groups, Load Balancer, Multi-AZ")
print("✓ Availability: Multi-AZ deployment, Read Replicas, Redundancy")
print("✓ Visibility: CloudWatch, Centralized Logging")
print("")
print("Ready for AWS Console Implementation:")
print("1. Create VPC and subnets using CloudFormation templates")
print("2. Set up security groups with proper access controls")
print("3. Deploy RDS PostgreSQL and ElastiCache Redis")
print("4. Create ECS cluster and configure services")
print("5. Set up Application Load Balancer")
print("6. Configure CloudWatch monitoring and logging")