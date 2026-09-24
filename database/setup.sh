#!/bin/bash

USER="DB_User"
PASWD="DB_Password"

if ! command -v mysql > /dev/null 2>&1; then
    echo "MySQL is not installed. Installing"
    sudo apt update
    sudo apt install -y mysql-server
fi
    echo "Setting up Database"
    sudo mysql -u "$USER" -p"$PASWD" < schema.sql
    sudo mysql -u "$USER" -p"$PASWD" < seed.sql
    sudo mysql -u "$USER" -p"$PASWD" < queries.sql
    echo "Finished"
    