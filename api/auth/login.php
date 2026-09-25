<?php

session_start();

header("Content-Type: application/json");

$mysqli = require_once "../../config/database.php";

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);

// TODO: Validate required fields
if(!isset($data["username"]) || !isset($data["password"]) || trim($data["username"]) === "" || trim($data["password"]) === "")
    {
        http_response_code(400);
        echo json_encode(["error" => "Username and password are required"]);
        exit;
    }
// TODO: Find user by username/email
$username = $data["username"];
$password = $data["password"];

$stmt = $mysqli->prepare("SELECT ID, Username, Password FROM users WHERE Username = ?");
$stmt -> bind_param("s", $data["username"]);
$stmt -> execute();
$result = $stmt -> get_result();
$user = $result -> fetch_assoc();

// TODO: Verify password using password_verify()
if(!$user || !password_verify($password, $user["Password"]))
    {
        http_response_code(401);
        echo json_encode(["error" => "Invailid username or password"]);
        exit;
    }
// TODO: Store user_id in $_SESSION
$_SESSION["user_id"] = $user["ID"];
// TODO: Return user information / success response
echo json_encode(["id" => $user["ID"], "username" => $user["Username"], "error" => ""]);

?>