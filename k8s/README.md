# Taskie Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Taskie application on EKS.

## Directory Structure

```
k8s/
├── namespace.yaml          # Namespace and basic setup
├── rbac.yaml              # RBAC configuration (ServiceAccounts, Roles, RoleBindings)
├── configmaps/            # Application configuration
├── secrets/               # Sensitive data (credentials, certificates)
├── storage/               # StorageClasses and PersistentVolumeClaims
├── database/              # PostgreSQL deployment manifests
├── redis/                 # Redis deployment manifests
├── backend/               # Backend API deployment manifests
├── frontend/              # Frontend deployment manifests
├── ingress/               # Ingress and load balancer configuration
├── monitoring/            # Monitoring and observability
├── security/              # NetworkPolicies and security configurations
└── scripts/               # Deployment and management scripts
```

## RBAC Configuration

### Service Accounts

1. **taskie-sa**: Main service account for application components (frontend, backend)
2. **taskie-db-sa**: Service account for database components with additional storage permissions

### Roles and Permissions

#### taskie-app-role

- Read access to ConfigMaps for application configuration
- Read access to Secrets for credentials and JWT keys
- Read access to Services and Endpoints for service discovery
- Read access to own Pod information for health checks

#### taskie-db-role

- All permissions from taskie-app-role
- Additional permissions to manage PersistentVolumeClaims for database storage

### Security Principles

- **Principle of Least Privilege**: Each service account has only the minimum permissions required
- **Namespace Isolation**: All permissions are scoped to the `taskie` namespace
- **Resource-Specific Access**: Permissions are granted for specific resource types only
- **No Cluster-Wide Permissions**: No ClusterRoles or ClusterRoleBindings are used

## Deployment Instructions

### Prerequisites

1. EKS cluster is running and accessible via kubectl
2. AWS Load Balancer Controller is installed
3. kubectl is configured to access the cluster

### Deploy Namespace and RBAC

```bash
# Apply namespace
kubectl apply -f namespace.yaml

# Apply RBAC configuration
kubectl apply -f rbac.yaml

# Verify deployment
kubectl get namespace taskie
kubectl get serviceaccounts -n taskie
kubectl get roles -n taskie
kubectl get rolebindings -n taskie
```

### Verification Commands

```bash
# Check namespace labels and annotations
kubectl describe namespace taskie

# Verify service accounts
kubectl describe serviceaccount taskie-sa -n taskie
kubectl describe serviceaccount taskie-db-sa -n taskie

# Check RBAC permissions
kubectl auth can-i get configmaps --as=system:serviceaccount:taskie:taskie-sa -n taskie
kubectl auth can-i create persistentvolumeclaims --as=system:serviceaccount:taskie:taskie-db-sa -n taskie

# List all resources in namespace
kubectl get all -n taskie
```

## Security Considerations

1. **Service Account Token Mounting**: Tokens are mounted only where needed
2. **Resource Scoping**: All permissions are namespace-scoped
3. **Minimal Permissions**: Each role has only the minimum required permissions
4. **Separation of Concerns**: Different service accounts for different component types

## Next Steps

After deploying the namespace and RBAC configuration:

1. Deploy ConfigMaps and Secrets (task 2)
2. Set up persistent storage (task 3)
3. Deploy database components (task 4)
4. Deploy application services (tasks 5-7)
5. Configure ingress and networking (task 8)
