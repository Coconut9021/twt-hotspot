#!/bin/bash

# DigitalOcean Deployment Script for TWT Hotspot
# Run this script on your DigitalOcean droplet

set -e

echo "🚀 Starting TWT Hotspot deployment on DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install essential packages
echo "📦 Installing essential packages..."
sudo apt install -y git nginx mysql-server ufw

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw allow 1812/udp  # RADIUS Auth
sudo ufw allow 1813/udp  # RADIUS Accounting
sudo ufw --force enable

# Configure MySQL
echo "🗄️ Configuring MySQL..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS twt_hotspot;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'twt_user'@'localhost' IDENTIFIED BY 'TWT_Secure_2024!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON twt_hotspot.* TO 'twt_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Clone or update repository
if [ -d "twt-hotspot" ]; then
    echo "📥 Updating existing repository..."
    cd twt-hotspot
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/your-username/twt-hotspot.git
    cd twt-hotspot
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create environment file
echo "⚙️ Creating environment file..."
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_USER=twt_user
DB_PASSWORD=TWT_Secure_2024!
DB_DATABASE=twt_hotspot
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# RADIUS Configuration
RADIUS_SERVER=41.191.232.2
NAS_IP=154.119.81.23
RADIUS_SECRET=your_radius_secret
EOF

# Create database tables
echo "🗄️ Setting up database tables..."
mysql -u twt_user -pTWT_Secure_2024! twt_hotspot < radius_schema.sql || true

# Stop any existing PM2 processes
pm2 stop twt-hotspot || true
pm2 delete twt-hotspot || true

# Start application with PM2
echo "🚀 Starting application..."
pm2 start index.js --name "twt-hotspot" --env production

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/twt-hotspot > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/twt-hotspot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment complete!"
echo "🌐 Your application should be accessible at: http://your_server_ip"
echo "📊 Check application status: pm2 status"
echo "📋 View logs: pm2 logs twt-hotspot"
echo ""
echo "🔧 Next steps:"
echo "1. Configure your RADIUS server to point to this application"
echo "2. Update DNS records if using a domain"
echo "3. Configure SSL certificate for HTTPS"
echo ""
echo "RADIUS Configuration:"
echo "- Server IP: 41.191.232.2"
echo "- NAS IP: 154.119.81.23"
echo "- Web Application: http://your_server_ip"
