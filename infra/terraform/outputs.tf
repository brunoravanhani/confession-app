output "site_bucket_name" {
  description = "Name of the S3 bucket used to store static content."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution identifier."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "Primary URL for the site. Uses custom domain when configured."
  value       = trimspace(var.custom_domain_name) != "" ? "https://${var.custom_domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "custom_domain_name" {
  description = "Configured custom domain name for CloudFront (empty when not configured)."
  value       = var.custom_domain_name
}
