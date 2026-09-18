<?php

header("Content-Type: application/json");

require_once "../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data["user_id"] ?? null;

// Validate user_id
if (/* user_id missing */) {
    // Return 400 error
    exit;
}

// Prepare SELECT query
// IMPORTANT: only return contacts belonging to this user
$stmt = $conn->prepare(
    // SELECT ...
    // FROM contacts
    // WHERE user_id = ?
);

// Bind user_id


// Execute query


// Get result


$contacts = [];

// Loop through result rows
while (/* rows still exist */) {
    // Add each contact to $contacts
}

// Return contacts as JSON


?>