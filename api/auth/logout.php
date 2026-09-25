<?php

session_start();

$_SESSION = [];

// TODO: Destroy session
session_destroy();
// TODO: Return success response
header("Content-Type: application/json");
echo json_encode("success" => true, "error" => "");


?>