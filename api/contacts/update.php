<?php

header("Content-Type: application/json");

require_once "../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$contactId = $data["contact_id"] ?? null;
$userId = $data["user_id"] ?? null;

$firstName = $data["first_name"] ?? null;
$lastName = $data["last_name"] ?? null;
$phone = $data["phone"] ?? null;
$email = $data["email"] ?? null;

// Validate request
if (/* missing contact_id, user_id, etc. */) {
    // Return 400 error
    exit;
}

// Prepare UPDATE query
$stmt = $conn->prepare(
    // UPDATE contacts
    // SET ...
    // WHERE id = ?
    // AND user_id = ?
);

// Bind parameters


// Execute query


// Check if a row was actually updated
if (/* contact updated */) {
    // Return success
} else {
    // Return not found / unauthorized-style response
}

?>