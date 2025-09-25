#!/bin/bash

# Deploy RBAC Configuration for Taskie Application
# This script deploys the namespace and RBAC configuration for the Taskie application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if kubectl can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_status "Starting RBAC deployment for Taskie application..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

# Deploy namespace
print_status "Deploying namespace..."
if kubectl apply -f "$K8S_DIR/namespace.yaml"; then
    print_status "Namespace deployed successfully"
else
    print_error "Failed to deploy namespace"
    exit 1
fi

# Wait for namespace to be ready
print_status "Waiting for namespace to be ready..."
kubectl wait --for=condition=Active namespace/taskie --timeout=30s

# Deploy RBAC configuration
print_status "Deploying RBAC configuration..."
if kubectl apply -f "$K8S_DIR/rbac.yaml"; then
    print_status "RBAC configuration deployed successfully"
else
    print_error "Failed to deploy RBAC configuration"
    exit 1
fi

# Verify deployment
print_status "Verifying deployment..."

# Check namespace
if kubectl get namespace taskie &> /dev/null; then
    print_status "✓ Namespace 'taskie' exists"
else
    print_error "✗ Namespace 'taskie' not found"
    exit 1
fi

# Check service accounts
for sa in taskie-sa taskie-db-sa; do
    if kubectl get serviceaccount "$sa" -n taskie &> /dev/null; then
        print_status "✓ ServiceAccount '$sa' exists"
    else
        print_error "✗ ServiceAccount '$sa' not found"
        exit 1
    fi
done

# Check roles
for role in taskie-app-role taskie-db-role; do
    if kubectl get role "$role" -n taskie &> /dev/null; then
        print_status "✓ Role '$role' exists"
    else
        print_error "✗ Role '$role' not found"
        exit 1
    fi
done

# Check role bindings
for rb in taskie-app-rolebinding taskie-db-rolebinding; do
    if kubectl get rolebinding "$rb" -n taskie &> /dev/null; then
        print_status "✓ RoleBinding '$rb' exists"
    else
        print_error "✗ RoleBinding '$rb' not found"
        exit 1
    fi
done

print_status "RBAC deployment completed successfully!"
print_status ""
print_status "Summary of deployed resources:"
echo "  - Namespace: taskie"
echo "  - ServiceAccounts: taskie-sa, taskie-db-sa"
echo "  - Roles: taskie-app-role, taskie-db-role"
echo "  - RoleBindings: taskie-app-rolebinding, taskie-db-rolebinding"
print_status ""
print_status "Next steps:"
echo "  1. Deploy ConfigMaps and Secrets (task 2)"
echo "  2. Set up persistent storage (task 3)"
echo "  3. Deploy database components (task 4)"