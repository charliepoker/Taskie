provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.tags, {
      Project   = "taskie"
      ManagedBy = "terraform"
      Environment = var.environment
      Component = "shared"
    })
  }
  
}