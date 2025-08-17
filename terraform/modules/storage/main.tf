# Storage Module - S3 buckets for logs and static assets

# Local values for consistent naming and tagging
locals {
  common_tags = {
    Module      = "storage"
    Environment = var.environment
    Project     = var.project_name
  }
}

# S3 bucket for application logs
resource "aws_s3_bucket" "logs" {
  bucket = var.logs_bucket_name

  tags = merge(local.common_tags, {
    Name     = var.logs_bucket_name
    Purpose  = "Application Logs"
    DataType = "logs"
  })
}

# S3 bucket versioning for logs
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# S3 bucket encryption for logs
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block for logs
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration for logs
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log_lifecycle"
    status = "Enabled"

    transition {
      days          = var.logs_transition_to_ia_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.logs_transition_to_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.logs_expiration_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.logs_noncurrent_version_expiration_days
    }
  }
}

# S3 bucket for static assets
resource "aws_s3_bucket" "static_assets" {
  bucket = var.static_bucket_name

  tags = merge(local.common_tags, {
    Name     = var.static_bucket_name
    Purpose  = "Static Assets"
    DataType = "static-content"
  })
}

# S3 bucket versioning for static assets
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# S3 bucket encryption for static assets
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block for static assets (conditional)
resource "aws_s3_bucket_public_access_block" "static_assets" {
  count  = var.enable_cloudfront ? 0 : 1
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for static assets (when CloudFront is enabled)
resource "aws_s3_bucket_policy" "static_assets" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.static_assets[0].arn
          }
        }
      }
    ]
  })
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "static_assets" {
  count                             = var.enable_cloudfront ? 1 : 0
  name                              = "${var.static_bucket_name}-oac"
  description                       = "OAC for ${var.static_bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution for static assets
resource "aws_cloudfront_distribution" "static_assets" {
  count = var.enable_cloudfront ? 1 : 0

  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.static_assets[0].id
    origin_id                = "S3-${aws_s3_bucket.static_assets.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.static_bucket_name}"
  default_root_object = var.cloudfront_default_root_object

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.cloudfront_min_ttl
    default_ttl            = var.cloudfront_default_ttl
    max_ttl                = var.cloudfront_max_ttl

    compress = true
  }

  # Cache behavior for API requests (if needed)
  dynamic "ordered_cache_behavior" {
    for_each = var.cloudfront_api_cache_behavior_enabled ? [1] : []
    content {
      path_pattern     = "/api/*"
      allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods   = ["GET", "HEAD", "OPTIONS"]
      target_origin_id = "S3-${aws_s3_bucket.static_assets.bucket}"

      forwarded_values {
        query_string = true
        headers      = ["Authorization", "CloudFront-Forwarded-Proto"]
        cookies {
          forward = "none"
        }
      }

      min_ttl                = 0
      default_ttl            = 0
      max_ttl                = 0
      compress               = true
      viewer_protocol_policy = "redirect-to-https"
    }
  }

  price_class = var.cloudfront_price_class

  restrictions {
    geo_restriction {
      restriction_type = var.cloudfront_geo_restriction_type
      locations        = var.cloudfront_geo_restriction_locations
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.cloudfront_acm_certificate_arn == null
    acm_certificate_arn            = var.cloudfront_acm_certificate_arn
    ssl_support_method             = var.cloudfront_acm_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = var.cloudfront_acm_certificate_arn != null ? "TLSv1.2_2021" : null
  }

  tags = merge(local.common_tags, {
    Name    = "${var.static_bucket_name}-cloudfront"
    Purpose = "Static Asset Distribution"
  })
}
