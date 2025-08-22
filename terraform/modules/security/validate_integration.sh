#!/bin/bash

# Validation script for security module integration
# This script checks that the security module is compatible with the existing setup

echo "🔍 Validating Security Module Integration..."

# Check if required files exist
echo "✅ Checking module structure..."
required_files=("main.tf" "variables.tf" "outputs.tf" "versions.tf" "README.md")
for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✓ $file exists"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

# Check Terraform formatting
echo "✅ Checking Terraform formatting..."
if terraform fmt -check > /dev/null 2>&1; then
    echo "  ✓ All files are properly formatted"
else
    echo "  ❌ Files need formatting"
    exit 1
fi

# Validate variable types and constraints
echo "✅ Checking variable definitions..."
if grep -q "validation {" variables.tf; then
    echo "  ✓ Variable validation rules found"
else
    echo "  ❌ No variable validation found"
    exit 1
fi

# Check for required outputs
echo "✅ Checking required outputs..."
required_outputs=("web_security_group_id" "app_security_group_id" "db_security_group_id" "ec2_role_arn" "ec2_instance_profile_name")
for output in "${required_outputs[@]}"; do
    if grep -q "output \"$output\"" outputs.tf; then
        echo "  ✓ $output output defined"
    else
        echo "  ❌ $output output missing"
        exit 1
    fi
done

# Check integration compatibility
echo "✅ Checking integration compatibility..."

# Verify vpc_id input matches networking module output
if grep -q "variable \"vpc_id\"" variables.tf; then
    echo "  ✓ vpc_id variable defined (compatible with networking module)"
else
    echo "  ❌ vpc_id variable missing"
    exit 1
fi

# Check that name_prefix follows shared naming convention
if grep -q "variable \"name_prefix\"" variables.tf; then
    echo "  ✓ name_prefix variable defined (compatible with shared locals)"
else
    echo "  ❌ name_prefix variable missing"
    exit 1
fi

# Verify tags variable for shared tag integration
if grep -q "variable \"tags\"" variables.tf; then
    echo "  ✓ tags variable defined (compatible with shared common_tags)"
else
    echo "  ❌ tags variable missing"
    exit 1
fi

echo ""
echo "🎉 Security Module Integration Validation Complete!"
echo "✅ All checks passed - module is ready for integration"
echo ""
echo "Next steps:"
echo "1. Create environment configurations in terraform/environments/"
echo "2. Call this module from environment main.tf files"
echo "3. Use module outputs in compute, database, and other modules"
echo ""
echo "Example integration:"
echo "  module \"security\" {"
echo "    source = \"../../modules/security\""
echo "    name_prefix = local.name_prefix"
echo "    vpc_id = module.networking.vpc_id"
echo "    tags = local.common_tags"
echo "  }"