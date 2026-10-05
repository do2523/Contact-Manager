<?php

header("Content-Type: application/json");

$mysqli = require_once "../../config/database.php";

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Get JSON body
$data = json_decode(file_get_contents("php://input"), true);

// TODO: Validate required fields
if(empty($data["username"]))
    {
        http_response_code(400);
        echo json_encode(["error" => "Username not provided"]);
        exit;
    }


if(strlen($data["password"]) < 8)
    {
        http_response_code(400);
        echo json_encode(["error" => "Password must be 8 characters long"]);
        exit;
    }

if(!preg_match("/[a-z]/i", $data["password"]))
{
   http_response_code(400);
   echo json_encode(["error" => "Password must contain at least 1 letter"]);
   exit;
}

if(!preg_match("/[0-9]/", $data["password"]))
{
   http_response_code(400);
   echo json_encode(["error" => "Password must contain at least 1 number"]);
   exit;
}

if($data["password"] !== $data["password_confirmation"])
    {
        http_response_code(400);
        echo json_encode(["error" => "Passwords must match"]);
        exit;
    }
// TODO: Check if username/email already exists

// TODO: Hash password
$password_hash = password_hash($data["password"], PASSWORD_DEFAULT);

// TODO: Insert user into database
$sql = "INSERT INTO users (Username, Password)
        VALUES (?, ?)";

$stmt = $mysqli -> stmt_init();

if(!$stmt -> prepare($sql))
    {
        http_response_code(500);
        echo json_encode(["error" => "SQL Error" . $mysqli -> error]);
        exit;
    }

$stmt -> bind_param("ss", $data["username"], $password_hash);

// TODO: Return success response
if($stmt -> execute())
    {
        echo json_encode(["success" => true, "error" => ""]);
        exit;
    }
else
    {
        if($mysqli -> errno === 1062)
            {
                http_response_code(409);
                echo json_encode(["error" => "Username is taken"]);
            }
        else
            {
                http_response_code(500);
                echo json_encode(["error" => "Database error" . $mysqli -> error]);
            }
        exit;
    }

?>