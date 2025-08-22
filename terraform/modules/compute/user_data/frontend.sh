#!/bin/bash
# User data script for frontend instances
# This script sets up the frontend application on Amazon Linux 2

# Update system packages
yum update -y

# Install required packages
yum install -y docker git awscli

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install Node.js (using NodeSource repository)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create application directory
mkdir -p /opt/taskie-frontend
cd /opt/taskie-frontend

# Set environment variables
export BACKEND_URL="${backend_url}"
export PORT="${port}"
export NODE_ENV="production"

# Create a simple systemd service file for the frontend
cat > /etc/systemd/system/taskie-frontend.service << EOF
[Unit]
Description=Taskie Frontend Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/taskie-frontend
Environment=NODE_ENV=production
Environment=PORT=${port}
Environment=NEXT_PUBLIC_API_URL=${backend_url}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create a placeholder package.json for the frontend
cat > /opt/taskie-frontend/package.json << EOF
{
  "name": "taskie-frontend",
  "version": "1.0.0",
  "description": "Taskie Frontend Application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

# Create a simple Express server as placeholder
cat > /opt/taskie-frontend/server.js << EOF
const express = require("express");
const app = express();
const port = process.env.PORT || ${port};

app.get("/", (req, res) => {
  res.send(\`
    <html>
      <head><title>Taskie Frontend</title></head>
      <body>
        <h1>Taskie Task Management</h1>
        <p>Frontend server is running on port \$${port}</p>
        <p>Backend URL: \$${process.env.NEXT_PUBLIC_API_URL || "${backend_url}"}</p>
        <p>Instance ID: \$${process.env.EC2_INSTANCE_ID || "unknown"}</p>
        <p>Status: Ready for deployment</p>
      </body>
    </html>
  \`);
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "frontend"
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(\`Frontend server listening on port \$${port}\`);
});
EOF

# Install npm dependencies
cd /opt/taskie-frontend
npm install

# Change ownership to ec2-user
chown -R ec2-user:ec2-user /opt/taskie-frontend

# Enable and start the service
systemctl daemon-reload
systemctl enable taskie-frontend
systemctl start taskie-frontend

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "Taskie/Frontend",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/taskie-frontend",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s

# Log completion
echo "Frontend instance setup completed at $(date)" >> /var/log/user-data.log