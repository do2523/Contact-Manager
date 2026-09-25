<?php

session_start();

header("Content-Type: application/json");

// TODO: Check if user_id exists in $_SESSION
if(isset($_SESSION["user_id"]))
    {
        $mysqli = require __DIR__ . "/../../config/database.php";

        $stmt = $mysqli -> prepare("SELECT * FROM users where ID = ?");
        $stmt -> bind_param("i", $_SESSION["user_id"]);
        $stmt -> execute();
        $result = $stmt -> get_result();
        $user = $result -> fetch_assoc();
        
    }
// TODO: Return 401 if no active session
else
    {
        header("http/1.1 401 Unauthorized");
        echo json_encode(["error" => "Unauthorized access"]);
        exit();
    }
// TODO: Return logged-in user information
if($user)
    {
        header("Content-Type: application/json");
        echo json_encode(array(
            "id" => $user["ID"],
            "username" => $user["Username"],
            "error" => ""));
    }
else
    {
        echo json_encode(array(
            "id" => 0,
            "username" => "",
            "error" => "Not logged in"));
    }
?>