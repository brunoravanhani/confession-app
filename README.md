This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## GitHub Actions Deploy Pipelines

This repository includes 2 deployment workflows:

1. `Deploy Infrastructure` (`.github/workflows/deploy-infra.yml`)
2. `Deploy Content` (`.github/workflows/deploy-content.yml`)

### 1) Deploy Infrastructure (Terraform)

Provisions AWS infrastructure with Terraform:

- S3 bucket for site content
- CloudFront distribution in front of S3
- CloudFront Origin Access Control (OAC)
- S3 bucket policy allowing reads only from this CloudFront distribution

Terraform code is located in `infra/terraform/`.

Trigger behavior:

- Runs on push to `main` when `infra/terraform/**` changes
- Runs on pull requests for Terraform changes (plan only)
- Supports manual trigger via `workflow_dispatch`

### 2) Deploy Content

Deploys project content to S3 and invalidates CloudFront cache:

- Installs dependencies and runs `npm run build`
- Publishes the static Next.js output from `out/` to S3
- Runs CloudFront invalidation (`/*`)

Trigger behavior:

- Runs on push to `main` when `public/**` or `data/**` changes
- Supports manual trigger via `workflow_dispatch`

## Required GitHub Secrets

Add these secrets in GitHub: `Settings -> Secrets and variables -> Actions`.

### AWS Authentication

- `AWS_REGION`: AWS region (example: `us-east-1`)
- `AWS_ROLE_TO_ASSUME`: IAM Role ARN used by GitHub Actions via OIDC

### Terraform State Backend

- `TF_STATE_BUCKET`: Existing S3 bucket name for Terraform state
- `TF_STATE_KEY`: State file key path (example: `confession-app/terraform.tfstate`)

### Infrastructure Variables

- `PROJECT_NAME`: Project name used in tags/resources (example: `confession-app`)
- `SITE_BUCKET_NAME`: Globally unique S3 bucket name for site content
- `CLOUDFRONT_PRICE_CLASS`: CloudFront price class (example: `PriceClass_100`)

### Content Deployment

- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID to invalidate

## Notes

- The infrastructure workflow is designed for OIDC-based AWS access (no static AWS access keys required).
- `TF_STATE_BUCKET` must exist before running the infrastructure workflow.
- After the first successful infrastructure deployment, use Terraform outputs to populate `CLOUDFRONT_DISTRIBUTION_ID`.
