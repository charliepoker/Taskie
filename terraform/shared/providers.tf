terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Increase timeout for provider initialization
  skip_credentials_validation = false
  skip_metadata_api_check     = false
  skip_region_validation      = false

  # Add retry configuration
  retry_mode  = "adaptive"
  max_retries = 3

  default_tags {
    tags = local.common_tags
  }
}
