<?php

header("Content-Type: application/json");

require_once "../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data["user_id"] ?? null;
$search = $data["search"] ?? "";

// Validate user_id
if (/* user_id missing */) {
    // Return 400 error
    exit;
}

// Format search term for LIKE
$searchTerm = "%" . $search . "%";

// Prepare search query
$stmt = $conn->prepare(
    // SELECT contact fields
    // FROM contacts
    // WHERE user_id = ?
    // AND (
    //     first_name LIKE ?
    //     OR last_name LIKE ?
    //     OR phone LIKE ?
    //     OR email LIKE ?
    // )
);

// Bind parameters


// Execute query


// Get result


$contacts = [];

// Add matching contacts to array


// Return contacts as JSON


?>