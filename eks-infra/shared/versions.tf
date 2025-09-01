terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70.0" # ARM64 compatible version
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.38.0" # Match installed version
    }
  }
}

