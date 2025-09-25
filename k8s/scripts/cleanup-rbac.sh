#!/bin/bash

# Cleanup script for Taskie Kubernetes namespace and RBAC configuration
# This script removes all namespace and RBAC resources

set -e

NAMESPACE="taskie"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧹 Cleaning up Taskie Kubernetes Resources..."
echo "============================================="

# Confirm deletion
read -p "⚠️  This will delete the entire '$NAMESPACE' namespace and all resources within it. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "   ℹ️  Namespace '$NAMESPACE' does not exist. Nothing to clean up."
    exit 0
fi

echo "🗑️  Deleting RBAC resources..."
kubectl delete -f "$K8S_DIR/rbac.yaml" --ignore-not-found=true
echo "   ✓ RBAC resources deleted"

echo ""

echo "🗑️  Deleting namespace..."
kubectl delete -f "$K8S_DIR/namespace.yaml" --ignore-not-found=true
echo "   ✓ Namespace deleted"

echo ""

# Wait for namespace to be fully deleted
echo "⏳ Waiting for namespace to be fully removed..."
while kubectl get namespace $NAMESPACE &> /dev/null; do
    echo "   Waiting for namespace deletion to complete..."
    sleep 5
done

echo ""
echo "✅ Cleanup completed successfully!"
echo "   All Taskie Kubernetes resources have been removed."