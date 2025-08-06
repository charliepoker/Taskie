#!/bin/bash
# User data script for backend instances
# This script sets up the backend application on Amazon Linux 2

# Update system packages
yum update -y

# Install required packages
yum install -y docker git awscli postgresql

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install Node.js (using NodeSource repository)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create application directory
mkdir -p /opt/taskie-backend
cd /opt/taskie-backend

# Set environment variables
export DATABASE_URL="${database_url}"
export REDIS_URL="${redis_url}"
export PORT="${port}"
export NODE_ENV="production"

# Create a simple systemd service file for the backend
cat > /etc/systemd/system/taskie-backend.service << EOF
[Unit]
Description=Taskie Backend Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/taskie-backend
Environment=NODE_ENV=production
Environment=PORT=${port}
Environment=DATABASE_URL=${database_url}
Environment=REDIS_URL=${redis_url}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create a placeholder package.json for the backend
cat > /opt/taskie-backend/package.json << EOF
{
  "name": "taskie-backend",
  "version": "1.0.0",
  "description": "Taskie Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  }
}
EOF

# Create a simple Express server as placeholder
cat > /opt/taskie-backend/server.js << EOF
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || ${port};

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "backend",
    database: process.env.DATABASE_URL ? "configured" : "not configured",
    redis: process.env.REDIS_URL ? "configured" : "not configured"
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Taskie Backend API",
    version: "1.0.0",
    status: "ready for deployment",
    endpoints: {
      health: "/health",
      api: "/api"
    }
  });
});

// Placeholder API endpoints
app.get("/api/tasks", (req, res) => {
  res.json({
    tasks: [],
    message: "Tasks endpoint ready for implementation"
  });
});

app.get("/api/projects", (req, res) => {
  res.json({
    projects: [],
    message: "Projects endpoint ready for implementation"
  });
});

app.get("/api/users", (req, res) => {
  res.json({
    users: [],
    message: "Users endpoint ready for implementation"
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(\`Backend server listening on port \$${port}\`);
  console.log(\`Database URL: \$${process.env.DATABASE_URL ? "configured" : "not configured"}\`);
  console.log(\`Redis URL: \$${process.env.REDIS_URL ? "configured" : "not configured"}\`);
});
EOF

# Install npm dependencies
cd /opt/taskie-backend
npm install

# Change ownership to ec2-user
chown -R ec2-user:ec2-user /opt/taskie-backend

# Enable and start the service
systemctl daemon-reload
systemctl enable taskie-backend
systemctl start taskie-backend

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "Taskie/Backend",
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
            "log_group_name": "/aws/ec2/taskie-backend",
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
echo "Backend instance setup completed at $(date)" >> /var/log/user-data.log