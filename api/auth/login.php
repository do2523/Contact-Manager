<?php

session_start();

header("Content-Type: application/json");

require_once "../../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// TODO: Validate required fields
// TODO: Find user by username/email
// TODO: Verify password using password_verify()
// TODO: Store user_id in $_SESSION
// TODO: Return user information / success response

?>