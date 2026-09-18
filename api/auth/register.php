<?php

header("Content-Type: application/json");

require_once "../../config/database.php";

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Get JSON body
$data = json_decode(file_get_contents("php://input"), true);

// TODO: Validate required fields
// TODO: Check if username/email already exists
// TODO: Hash password
// TODO: Insert user into database
// TODO: Return success response

?>