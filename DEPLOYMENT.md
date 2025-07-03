# 🚀 DigitalOcean Deployment Instructions for TWT Hotspot

## Step 1: Create DigitalOcean Droplet

1. **Login to DigitalOcean**
   - Go to https://cloud.digitalocean.com/
   - Click "Create" → "Droplet"

2. **Configure Droplet**
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month minimum - 2GB RAM, 1 CPU, 50GB SSD)
   - **Region**: Choose closest to your location
   - **Authentication**: Add your SSH key (create one if you don't have it)
   - **Hostname**: twt-hotspot
   - Click "Create Droplet"

3. **Note down the IP address** of your new droplet

## Step 2: Connect to Your Server

Open terminal/command prompt and connect via SSH:
```bash
ssh root@YOUR_DROPLET_IP
```

## Step 3: Upload and Run Deployment Script

On your server, run these commands:

```bash
# Download the deployment script
curl -o deploy.sh https://raw.githubusercontent.com/YOUR_USERNAME/twt-hotspot/main/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

## Step 4: Update Repository URL

Before running the script, edit it to use your actual GitHub repository:

```bash
nano deploy.sh
```

Change this line:
```bash
git clone https://github.com/your-username/twt-hotspot.git
```

To your actual repository URL.

## Step 5: Configure Environment Variables

After deployment, edit the environment file:

```bash
cd twt-hotspot
nano .env
```

Update these values:
```
# Your RADIUS server from the image
RADIUS_SERVER=41.191.232.2
NAS_IP=154.119.81.23
RADIUS_SECRET=your_actual_radius_secret

# Database (these are set by the script)
DB_HOST=localhost
DB_USER=twt_user
DB_PASSWORD=TWT_Secure_2024!
DB_DATABASE=twt_hotspot
```

## Step 6: Restart the Application

```bash
pm2 restart twt-hotspot
```

## Step 7: Configure Your RADIUS Server

On your RADIUS server (41.191.232.2), you need to:

1. **Update clients.conf** to include your DigitalOcean server:
```
client twt-hotspot {
    ipaddr = YOUR_DROPLET_IP
    secret = your_radius_secret
    require_message_authenticator = no
    nas_type = other
}
```

2. **Configure SQL module** to use your DigitalOcean database:
```
sql {
    driver = "mysql"
    server = "YOUR_DROPLET_IP"
    login = "twt_user"
    password = "TWT_Secure_2024!"
    radius_db = "twt_hotspot"
}
```

## Step 8: Test Your Setup

1. **Access your application**:
   - Go to `http://YOUR_DROPLET_IP`
   - You should see the registration form

2. **Test registration**:
   - Fill out the form and submit
   - Check if you're redirected to the success page

3. **Check admin dashboard**:
   - Go to `http://YOUR_DROPLET_IP/admin`
   - You should see the RADIUS server info and user table

## Step 9: Monitor and Manage

```bash
# Check application status
pm2 status

# View logs
pm2 logs twt-hotspot

# Restart if needed
pm2 restart twt-hotspot

# Check nginx status
sudo systemctl status nginx
```

## Important Notes:

1. **Firewall**: The script configures UFW to allow necessary ports
2. **SSL**: Consider adding SSL certificate for HTTPS
3. **Backup**: Set up regular database backups
4. **Domain**: Point your domain to the droplet IP if you have one

## Troubleshooting:

If something goes wrong:
1. Check logs: `pm2 logs twt-hotspot`
2. Check nginx: `sudo nginx -t`
3. Restart services: `pm2 restart twt-hotspot && sudo systemctl restart nginx`

## Security Recommendations:

1. Change default passwords
2. Enable SSL/HTTPS
3. Regular security updates
4. Monitor logs regularly
5. Set up fail2ban for SSH protection

Your application will be accessible at: `http://YOUR_DROPLET_IP`
Admin dashboard: `http://YOUR_DROPLET_IP/admin`
