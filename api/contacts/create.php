<?php

header("Content-Type: application/json");

require_once "../db.php";

// Read JSON body
$data = json_decode(file_get_contents("php://input"), true);

// Get fields from request
$userId = $data["user_id"] ?? null;
$firstName = $data["first_name"] ?? null;
$lastName = $data["last_name"] ?? null;
$phone = $data["phone"] ?? null;
$email = $data["email"] ?? null;

// Validate required fields
if (/* missing required fields */) {
    // Return 400 error
    exit;
}

// Prepare INSERT query
$stmt = $conn->prepare(
    // INSERT contact into contacts table
);

// Bind parameters


// Execute statement


// Return success/error JSON


// Close statement/connection

?>