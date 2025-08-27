provider "aws" {
  region = "us-east-1" # Using the region from your AWS config
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.17.0"
    }
  }
}
