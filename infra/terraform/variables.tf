variable "aws_region" {
  description = "AWS region where resources will be created."
  type        = string
}

variable "project_name" {
  description = "Project identifier used in tags and resource naming."
  type        = string
}

variable "site_bucket_name" {
  description = "Unique S3 bucket name for static content."
  type        = string
}

variable "site_bucket_force_destroy" {
  description = "Whether to allow force-destroying the site bucket when it contains objects."
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "custom_domain_name" {
  description = "Custom domain for CloudFront distribution (example: confession.example.com)."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN for the custom domain. Must be in us-east-1 for CloudFront. If empty and route53_zone_id is set, Terraform creates and validates one automatically."
  type        = string
  default     = ""
}

variable "create_route53_record" {
  description = "Whether to create Route53 A/AAAA alias records for the custom domain."
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID. Used for optional DNS records and for ACM DNS validation when creating certificate automatically."
  type        = string
  default     = ""
}

variable "route53_record_name" {
  description = "Record name to create in Route53. If empty, custom_domain_name is used."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags to apply to resources."
  type        = map(string)
  default     = {}
}
