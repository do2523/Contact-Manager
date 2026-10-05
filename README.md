# Contact Manager

Website: http://purifiedmint.xyz/

Contact Manager is a web application designed for COP4331 that allows users to create an account, log in, and manage their personal contacts.

Once logged in, users can view all of their saved contacts and contact information, search through contacts, add new contacts, edit existing contacts, and delete contacts they no longer need.

The application was designed, implemented, and tested using a LAMP architecture.

## Tech Stack

### Backend
- Linux Ubuntu
- Apache
- MySQL
- PHP

### Frontend
- HTML
- CSS
- JavaScript

## Features

- User registration
- User login and logout
- PHP session-based authentication
- View all contacts belonging to the logged-in user
- Search contacts by first or last name
- Add new contacts
- Edit existing contacts
- Delete contacts
- Contact validation
- Duplicate phone and email detection
- PHP API endpoints for authentication and contact management

## Project Structure

```text
Contact-Manager/
├── api/
│   ├── auth/
│   │   ├── login.php
│   │   ├── logout.php
│   │   ├── register.php
│   │   └── session.php
│   ├── config/
│   │   └── database.php
│   └── contacts/
│       ├── create.php
│       ├── delete.php
│       ├── get.php
│       ├── search.php
│       └── update.php
├── database/
├── docs/
├── presentation/
└── public/
    ├── css/
    ├── js/
    └── index.html
```

# Setup

## 1. Install the LAMP Stack

The application requires Linux, Apache, MySQL, and PHP.

On Ubuntu, run:

```bash
sudo apt update
sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql
```

Verify Apache is running:

```bash
sudo systemctl status apache2
```

Verify MySQL is running:

```bash
sudo systemctl status mysql
```

## 2. Clone the Repository

Move into Apache's web directory:

```bash
cd /var/www/html
```

Clone the repository:

```bash
sudo git clone <repository-url> Contact-Manager
```

Move into the project:

```bash
cd Contact-Manager
```

## 3. Configure the Database

Open MySQL:

```bash
sudo mysql
```

Create the database:

```sql
CREATE DATABASE contact_manager;
```

If the project contains a database SQL file, import it using:

```bash
mysql -u root -p contact_manager < database/database.sql
```

The database should contain the required tables for users and contacts.

Each contact is associated with the user who created it.

## 4. Configure Database Credentials

Open:

```text
api/config/database.php
```

Update the database connection information to match your MySQL configuration.

Example:

```php
<?php

$host = "localhost";
$username = "your_database_username";
$password = "your_database_password";
$database = "contact_manager";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Database connection failed.");
}
?>
```


## 5. Configure Frontend API Requests

Frontend JavaScript should make requests to the `/api` route.

For example:

```javascript
fetch("/api/auth/login.php", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
});
```

Using `/api/...` allows the frontend and backend to operate under the same domain.

## 9. Open the Application

Visit:

```text
https://yourdomain.com/
```

For local development, depending on your Apache configuration, the application may instead be available at:

```text
http://localhost/Contact-Manager/public/
```

# Authentication

Authentication is handled using PHP sessions.

After a successful login, the user's ID is stored in:

```php
$_SESSION["user_id"]
```

API endpoints use the session to determine which user is currently logged in.

Users do not need to manually provide their User ID when creating, viewing, editing, searching, or deleting contacts.

# API

## Authentication Endpoints

```text
POST /api/auth/register.php
POST /api/auth/login.php
POST /api/auth/logout.php
GET  /api/auth/session.php
```

## Contact Endpoints

```text
GET  /api/contacts/get.php
GET  /api/contacts/search.php
POST /api/contacts/create.php
POST /api/contacts/update.php
POST /api/contacts/delete.php
```

# Contact Validation

When creating or updating contacts:

- First name is required
- Last name is required
- At least one phone number or email address is required
- Duplicate phone numbers are checked per user
- Duplicate email addresses are checked per user

# Architecture

The application follows a traditional LAMP architecture.

```text
Browser
   |
   | HTML / CSS / JavaScript
   v
Apache Web Server
   |
   | HTTP Requests
   v
PHP API
   |
   | SQL Queries
   v
MySQL Database
```

The frontend sends HTTP requests to the PHP API.

The PHP API handles authentication, validation, sessions, and database operations.

MySQL stores user accounts and contact information.

# Security

The application includes several security practices:

- Passwords are hashed before being stored
- Passwords are verified using PHP password verification
- Authentication uses server-side PHP sessions
- Contact operations are restricted to the logged-in user
- Users cannot access another user's contacts by changing a User ID
- Database queries should use prepared statements
- Production database credentials should not be committed to GitHub

# Course

This project was created for:

**COP4331 - Processes for Object-Oriented Software Development**
