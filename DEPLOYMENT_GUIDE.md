# Bulkmail Deployment Guide

This guide will help you deploy the Bulkmail application to your server.

## Prerequisites

1. A Linux server with:
   - Docker and Docker Compose installed
   - At least 2GB of RAM (4GB recommended)
   - At least 10GB of free disk space
   - Ports 80 and 443 open
2. A domain name pointing to your server's IP address
3. Basic knowledge of Linux command line

## Deployment Steps

### 1. Connect to Your Server

```bash
ssh username@your-server-ip
```

### 2. Install Dependencies

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone the Repository

```bash
# Create a directory for the application
mkdir -p ~/apps && cd ~/apps

# Clone the repository
git clone https://github.com/yourusername/bulkmail.git
cd bulkmail
```

### 4. Run the Deployment Script

```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Run the deployment script (as root)
sudo ./scripts/deploy.sh
```

The script will guide you through the setup process and ask for required information.

### 5. Configure Your Domain

After deployment, you'll need to configure your domain's DNS settings to point to your server's IP address. This typically involves:

1. Logging into your domain registrar's website
2. Finding the DNS management section
3. Creating an A record that points your domain to your server's IP address

### 6. Access the Application

Once the deployment is complete and DNS has propagated (this can take up to 24 hours, but usually much faster), you can access the application at:

```
https://your-domain.com
```

## Post-Deployment Tasks

### Change Default Admin Password

1. Log in with the default admin credentials provided at the end of the deployment
2. Navigate to the admin panel
3. Go to User Settings
4. Change the default password

### Set Up Email Providers

1. Log in to the admin panel
2. Navigate to Settings > Email Providers
3. Configure at least one email provider (SMTP, Mailcow, etc.)

### Set Up Backups (Recommended)

```bash
# Create a daily backup script
cat > /etc/cron.daily/bulkmail-backup << 'EOL'
#!/bin/bash
BACKUP_DIR="/var/backups/bulkmail/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker exec bulkmail_db pg_dump -U postgres bulkmail > "$BACKUP_DIR/db_backup.sql"

# Backup configuration
cp /opt/bulkmail/.env "$BACKUP_DIR/"

# Keep backups for 30 days
find /var/backups/bulkmail -type d -mtime +30 -exec rm -rf {} \;
EOL

# Make the script executable
chmod +x /etc/cron.daily/bulkmail-backup
```

## Updating the Application

To update to the latest version:

```bash
# Navigate to the application directory
cd /opt/bulkmail

# Pull the latest changes
git pull

# Run the deployment script again
sudo ./scripts/deploy.sh
```

## Troubleshooting

### View Logs

```bash
# View all container logs
cd /opt/bulkmail
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db
```

### Common Issues

1. **Port already in use**: Make sure no other services are using ports 80 or 443
2. **Database connection issues**: Verify database credentials in `.env`
3. **SSL certificate issues**: Check Let's Encrypt logs with `docker-compose -f docker-compose.prod.yml logs certbot`

## Support

If you encounter any issues during deployment, please:

1. Check the logs using the commands above
2. Check the [GitHub Issues](https://github.com/yourusername/bulkmail/issues) page
3. If the issue isn't reported, open a new issue with details about your problem

## Security Considerations

- Keep your server's operating system and Docker up to date
- Use strong passwords for all accounts
- Regularly back up your data
- Monitor the application logs for suspicious activity
- Consider setting up a firewall (e.g., UFW) to restrict access to necessary ports
