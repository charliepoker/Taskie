#!/bin/bash

# Taskie AWS Infrastructure Deployment Script
# This script deploys the complete AWS infrastructure for the Taskie application

set -e

# Configuration
PROJECT_NAME="taskie"
AWS_REGION="us-east-1"
DB_PASSWORD=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is configured"
}

# Function to generate a secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to deploy CloudFormation stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local parameters=$3
    
    print_status "Deploying stack: $stack_name"
    
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Stack $stack_name already exists. Updating..."
        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters "$parameters" \
            --region "$AWS_REGION" \
            --capabilities CAPABILITY_IAM || true
    else
        print_status "Creating new stack: $stack_name"
        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body "file://$template_file" \
            --parameters "$parameters" \
            --region "$AWS_REGION" \
            --capabilities CAPABILITY_IAM
    fi
    
    print_status "Waiting for stack $stack_name to complete..."
    aws cloudformation wait stack-create-complete --stack-name "$stack_name" --region "$AWS_REGION" 2>/dev/null || \
    aws cloudformation wait stack-update-complete --stack-name "$stack_name" --region "$AWS_REGION" 2>/dev/null || true
    
    print_success "Stack $stack_name deployed successfully"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  Taskie AWS Infrastructure Deployment"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_aws_cli
    
    # Generate database password if not provided
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(generate_password)
        print_status "Generated secure database password"
    fi
    
    # Deploy network infrastructure
    print_status "Step 1: Deploying network infrastructure..."
    deploy_stack \
        "${PROJECT_NAME}-network" \
        "cloudformation-templates/01-network.yaml" \
        "ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME"
    
    # Deploy security groups
    print_status "Step 2: Deploying security groups..."
    deploy_stack \
        "${PROJECT_NAME}-security" \
        "cloudformation-templates/02-security-groups.yaml" \
        "ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME"
    
    # Deploy database infrastructure
    print_status "Step 3: Deploying database infrastructure..."
    deploy_stack \
        "${PROJECT_NAME}-database" \
        "cloudformation-templates/03-database.yaml" \
        "ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME ParameterKey=DBUsername,ParameterValue=taskieadmin ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD"
    
    # Get outputs
    print_status "Retrieving deployment information..."
    
    VPC_ID=$(aws cloudformation describe-stacks --stack-name "${PROJECT_NAME}-network" --region "$AWS_REGION" --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' --output text)
    DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "${PROJECT_NAME}-database" --region "$AWS_REGION" --query 'Stacks[0].Outputs[?OutputKey==`PostgreSQLEndpoint`].OutputValue' --output text)
    REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "${PROJECT_NAME}-database" --region "$AWS_REGION" --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text)
    
    echo
    echo "=========================================="
    echo "         Deployment Complete!"
    echo "=========================================="
    echo
    print_success "Infrastructure deployed successfully!"
    echo
    echo "Deployment Details:"
    echo "-------------------"
    echo "Project Name: $PROJECT_NAME"
    echo "AWS Region: $AWS_REGION"
    echo "VPC ID: $VPC_ID"
    echo "Database Endpoint: $DB_ENDPOINT"
    echo "Redis Endpoint: $REDIS_ENDPOINT"
    echo "Database Username: taskieadmin"
    echo "Database Password: $DB_PASSWORD"
    echo
    echo "Next Steps:"
    echo "1. Create ECR repositories for your container images"
    echo "2. Build and push your Docker images"
    echo "3. Create ECS cluster and services"
    echo "4. Configure Application Load Balancer"
    echo "5. Set up monitoring and logging"
    echo
    print_warning "IMPORTANT: Save the database password securely!"
    echo "Database Connection String:"
    echo "postgresql://taskieadmin:$DB_PASSWORD@$DB_ENDPOINT:5432/taskietaskie"
    echo
}

# Run main function
main "$@"