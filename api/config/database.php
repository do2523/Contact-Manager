<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "login_db";

// Create MySQL connection
$mysql = new mysqli(hostname: $host, username: $username, password: $password, database: $database);

// Check if connection failed
if($mysql -> connect_error)
    {
        die("Connection error:" . $mysql -> connect_error);
    }

return $mysql;
?>