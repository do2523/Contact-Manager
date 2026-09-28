<?php

header("Content-Type: application/json");

//connect to database
$conn = require_once "../config/database.php";
    
if($conn->connect_error)
{
    returnWithError($conn->connect_error,500);
}
// read json body
$inData = json_decode(file_get_contents("php://input"), true);

// get fields from request
$ContactID = $inData["ContactID"] ?? null;
$UserID = $inData["UserID"] ?? null;

// Validate request
if (empty($ContactID) || empty($UserID)) {
    // Return 400 error
    returnWithError("ContactID and UserID are required", 400);
}

    
// Prepare DELETE query
$stmt = $conn->prepare(
    "DELETE FROM contacts
    WHERE ContactID = ?
    AND UserID = ?"
);

if(!$stmt){
    returnWithError("Prepare failed: " . $conn->error, 500);
}

// Bind parameters
$stmt->bind_param("ii", $ContactID, $UserID);

// Execute query
if(!$stmt->execute()){
    returnWithError("Delete failed: " . $stmt->error, 500);
}
    
if($stmt->affected_rows === 0){
    returnWithError("No matching contact found to delete", 404);
}

$stmt->close();
$conn->close();

returnWithSuccess([
    "ContactID" => (int)$ContactID
]);

// helper function
function returnWithError($err, $statusCode = 400)
{
    http_response_code($statusCode);
    echo json_encode(["contacts" => [], "error" => $err]);
    exit;
}

function returnWithSuccess($contact)
{
    echo json_encode(["contacts" => [$contact], "error" => ""]);
    exit;
}
?>
// i changed