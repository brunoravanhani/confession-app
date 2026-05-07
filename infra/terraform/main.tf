provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

locals {
  common_tags = merge(
    {
      Project   = var.project_name
      ManagedBy = "terraform"
    },
    var.tags
  )

  has_custom_domain             = trimspace(var.custom_domain_name) != ""
  should_create_acm_certificate = local.has_custom_domain && trimspace(var.acm_certificate_arn) == "" && trimspace(var.route53_zone_id) != ""
  effective_acm_certificate_arn = local.should_create_acm_certificate ? try(aws_acm_certificate_validation.site[0].certificate_arn, "") : trimspace(var.acm_certificate_arn)
  use_custom_domain             = local.has_custom_domain && local.effective_acm_certificate_arn != ""
}

resource "aws_acm_certificate" "site" {
  provider = aws.us_east_1
  count    = local.should_create_acm_certificate ? 1 : 0

  domain_name       = var.custom_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

resource "aws_route53_record" "site_cert_validation" {
  for_each = local.should_create_acm_certificate ? {
    for dvo in aws_acm_certificate.site[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  zone_id         = var.route53_zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

resource "aws_acm_certificate_validation" "site" {
  provider = aws.us_east_1
  count    = local.should_create_acm_certificate ? 1 : 0

  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for record in aws_route53_record.site_cert_validation : record.fqdn]
}

resource "aws_s3_bucket" "site" {
  bucket        = var.site_bucket_name
  force_destroy = var.site_bucket_force_destroy

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.project_name}-oac"
  description                       = "CloudFront access control for ${var.site_bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class
  comment             = "${var.project_name} static site"
  aliases             = local.use_custom_domain ? [var.custom_domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "site-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  # Cache behavior for versioned assets (JS, CSS, fonts) - long cache with immutable flag
  cache_behavior {
    path_pattern           = "*.js"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.css"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.woff*"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.ttf"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.otf"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # Cache behavior for images - long cache
  cache_behavior {
    path_pattern           = "*.jpg"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.jpeg"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.png"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.gif"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.webp"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.svg"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "*.ico"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # Cache behavior for crawl files - medium cache
  cache_behavior {
    path_pattern           = "/robots.txt"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "/sitemap.xml"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  cache_behavior {
    path_pattern           = "/ads.txt"
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # Default cache behavior for HTML pages - short cache with revalidation
  default_cache_behavior {
    target_origin_id       = "site-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 604800 # 1 week
    max_ttl                = 604800

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.use_custom_domain ? false : true
    acm_certificate_arn            = local.use_custom_domain ? local.effective_acm_certificate_arn : null
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_domain ? "TLSv1.2_2021" : null
  }

  lifecycle {
    precondition {
      condition     = !local.has_custom_domain || local.effective_acm_certificate_arn != ""
      error_message = "For custom domain, provide acm_certificate_arn or set route53_zone_id so Terraform can create and validate an ACM certificate automatically."
    }
  }

  tags = local.common_tags
}

# Invalidate CloudFront cache on every deploy to ensure HTML updates are served immediately
resource "aws_cloudfront_invalidation" "site" {
  distribution_id = aws_cloudfront_distribution.site.id
  paths           = ["/", "/index.html", "/*.html", "/robots.txt", "/sitemap.xml", "/ads.txt"]

  # Terraform will automatically trigger invalidation when distribution changes
  depends_on = [aws_cloudfront_distribution.site]
}

resource "aws_route53_record" "site_a" {
  count = var.create_route53_record ? 1 : 0

  zone_id = var.route53_zone_id
  name    = trimspace(var.route53_record_name) != "" ? var.route53_record_name : var.custom_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site_aaaa" {
  count = var.create_route53_record ? 1 : 0

  zone_id = var.route53_zone_id
  name    = trimspace(var.route53_record_name) != "" ? var.route53_record_name : var.custom_domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.site.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.site.arn
          }
        }
      }
    ]
  })
}
