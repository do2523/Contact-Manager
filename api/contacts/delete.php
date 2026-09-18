<?php

header("Content-Type: application/json");

require_once "../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$contactId = $data["contact_id"] ?? null;
$userId = $data["user_id"] ?? null;

// Validate request
if (/* missing contact_id or user_id */) {
    // Return 400 error
    exit;
}

// Prepare DELETE query
$stmt = $conn->prepare(
    // DELETE FROM contacts
    // WHERE id = ?
    // AND user_id = ?
);

// Bind parameters


// Execute query


// Check affected rows
if (/* contact deleted */) {
    // Return success
} else {
    // Return not found
}

?>