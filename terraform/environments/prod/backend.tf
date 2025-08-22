# Backend configuration for Production environment
# This configures remote state storage in S3 with DynamoDB locking

terraform {
  backend "s3" {
    # S3 bucket for storing Terraform state
    bucket = "taskie-terraform-state-bootstrap-2025"

    # Path within the bucket where the state file will be stored
    key = "environments/prod/terraform.tfstate"

    # AWS region where the S3 bucket is located
    region = "us-east-1"

    # DynamoDB table for state locking
    dynamodb_table = "terraform-state-locks"

    # Enable encryption of the state file
    encrypt = true
  }
}

# Note: This backend uses the shared bootstrap infrastructure:
# 1. S3 bucket: "taskie-terraform-state-bootstrap-2025" (created by bootstrap)
# 2. DynamoDB table: "terraform-state-locks" (created by bootstrap)
# 3. Each environment uses a different key path within the same bucket
# 4. State files are encrypted using S3's default encryption
#
# The bootstrap infrastructure was created in terraform/bootstrap/
# Now you can initialize this backend:
# 1. terraform init
# 2. When prompted, choose to migrate existing state to the new backend
