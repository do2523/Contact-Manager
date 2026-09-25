#!/bin/bash

USER="DB_User"
PASWD="DB_Password"

if ! command -v mysql > /dev/null 2>&1; then
    echo "MySQL is not installed. Installing"
    sudo apt update
    sudo apt install -y mysql-server
fi
    echo "Setting up Database"
    echo "Creating DB_User"
    sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS contact_manager;
USE contact_manager; 
CREATE USER IF NOT EXISTS '$USER'@'%' IDENTIFIED BY '$PASWD';
GRANT ALL PRIVILEGES on contact_manager.* to '$USER'@'%';
FLUSH PRIVILEGES;
EOF

    mysql -u "$USER" -p"$PASWD" < schema.sql
    mysql -u "$USER" -p"$PASWD" < seed.sql
    mysql -u "$USER" -p"$PASWD" < queries.sql
    echo "Finished Setting up Database"
    