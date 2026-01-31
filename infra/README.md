# Infrastructure

This directory is reserved for infrastructure-as-code configurations:

- **Kubernetes manifests** (deployment, services, ingress)
- **Terraform/Pulumi** configurations
- **Docker Compose** files for production
- **CI/CD pipeline** configurations
- **Cloud provider** specific configs (AWS, GCP, Azure)

## Structure (Planned)

```text
infra/
├── k8s/           # Kubernetes manifests
├── terraform/     # Infrastructure as Code
├── docker/        # Dockerfiles and compose files
└── scripts/       # Deployment scripts
```
