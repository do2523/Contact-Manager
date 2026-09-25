<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "login_db";

// Create MySQL connection
$mysqli = new mysqli(hostname: $host, username: $username, password: $password, database: $database);

// Check if connection failed
if($mysqli -> connect_error)
    {
        http_response_code(500);
        echo json_encode(["error" => "SQL Error" . $mysqli -> connect_error]);
        exit;
    }

return $mysqli;
?>