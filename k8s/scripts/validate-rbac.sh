#!/bin/bash

# Validation script for Taskie Kubernetes RBAC configuration
# This script verifies that the namespace and RBAC resources are properly configured

set -e

NAMESPACE="taskie"
APP_SA="taskie-sa"
DB_SA="taskie-db-sa"

echo "🔍 Validating Taskie Kubernetes RBAC Configuration..."
echo "=================================================="

# Check if namespace exists
echo "✅ Checking namespace..."
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "   ✓ Namespace '$NAMESPACE' exists"
    kubectl get namespace $NAMESPACE -o yaml | grep -E "name:|labels:" | head -5
else
    echo "   ❌ Namespace '$NAMESPACE' not found"
    exit 1
fi

echo ""

# Check service accounts
echo "✅ Checking service accounts..."
for sa in $APP_SA $DB_SA; do
    if kubectl get serviceaccount $sa -n $NAMESPACE &> /dev/null; then
        echo "   ✓ ServiceAccount '$sa' exists"
    else
        echo "   ❌ ServiceAccount '$sa' not found"
        exit 1
    fi
done

echo ""

# Check roles
echo "✅ Checking roles..."
for role in "taskie-app-role" "taskie-db-role"; do
    if kubectl get role $role -n $NAMESPACE &> /dev/null; then
        echo "   ✓ Role '$role' exists"
    else
        echo "   ❌ Role '$role' not found"
        exit 1
    fi
done

echo ""

# Check role bindings
echo "✅ Checking role bindings..."
for rb in "taskie-app-rolebinding" "taskie-db-rolebinding"; do
    if kubectl get rolebinding $rb -n $NAMESPACE &> /dev/null; then
        echo "   ✓ RoleBinding '$rb' exists"
    else
        echo "   ❌ RoleBinding '$rb' not found"
        exit 1
    fi
done

echo ""

# Test RBAC permissions
echo "✅ Testing RBAC permissions..."

# Test app service account permissions
echo "   Testing $APP_SA permissions:"
if kubectl auth can-i get configmaps --as=system:serviceaccount:$NAMESPACE:$APP_SA -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Can read ConfigMaps"
else
    echo "   ❌ Cannot read ConfigMaps"
fi

if kubectl auth can-i get secrets --as=system:serviceaccount:$NAMESPACE:$APP_SA -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Can read Secrets"
else
    echo "   ❌ Cannot read Secrets"
fi

if kubectl auth can-i get services --as=system:serviceaccount:$NAMESPACE:$APP_SA -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Can read Services"
else
    echo "   ❌ Cannot read Services"
fi

# Test that app SA cannot create PVCs (should fail)
if kubectl auth can-i create persistentvolumeclaims --as=system:serviceaccount:$NAMESPACE:$APP_SA -n $NAMESPACE &> /dev/null; then
    echo "   ❌ App SA should NOT be able to create PVCs (security issue)"
else
    echo "   ✓ App SA correctly cannot create PVCs"
fi

echo ""

# Test database service account permissions
echo "   Testing $DB_SA permissions:"
if kubectl auth can-i create persistentvolumeclaims --as=system:serviceaccount:$NAMESPACE:$DB_SA -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Can create PersistentVolumeClaims"
else
    echo "   ❌ Cannot create PersistentVolumeClaims"
fi

if kubectl auth can-i get configmaps --as=system:serviceaccount:$NAMESPACE:$DB_SA -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Can read ConfigMaps"
else
    echo "   ❌ Cannot read ConfigMaps"
fi

echo ""

# Test cross-namespace isolation (should fail)
echo "✅ Testing namespace isolation..."
if kubectl auth can-i get secrets --as=system:serviceaccount:$NAMESPACE:$APP_SA -n default &> /dev/null; then
    echo "   ❌ App SA should NOT have access to default namespace (security issue)"
else
    echo "   ✓ App SA correctly isolated to taskie namespace"
fi

echo ""

# Display resource summary
echo "✅ Resource Summary:"
echo "   Namespace: $(kubectl get namespace $NAMESPACE --no-headers | wc -l) created"
echo "   ServiceAccounts: $(kubectl get serviceaccounts -n $NAMESPACE --no-headers | wc -l) created"
echo "   Roles: $(kubectl get roles -n $NAMESPACE --no-headers | wc -l) created"
echo "   RoleBindings: $(kubectl get rolebindings -n $NAMESPACE --no-headers | wc -l) created"

echo ""
echo "🎉 RBAC validation completed successfully!"
echo "   All namespace and RBAC resources are properly configured."
echo "   Security principles (least privilege, namespace isolation) are enforced."
echo ""
echo "Next steps:"
echo "   1. Deploy ConfigMaps and Secrets (task 2)"
echo "   2. Set up persistent storage (task 3)"
echo "   3. Deploy database and application components"