<?php

header("Content-Type: application/json");

require_once "../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$ContactID = $data["ContactID"] ?? null;
$UserID = $data["UserID"] ?? null;
$FirstName = $data["FirstName"] ?? null;
$LastName = $data["LastName"] ?? null;
$Phone = $data["Phone"] ?? null;
$Email = $data["Email"] ?? null;

// Validate request
if (/* missing ContactID, UserID, etc. */) {
    // Return 400 error
    exit;
}
// makes sure one user can never edit another user's contact  just by guessing an id
// Prepare UPDATE query
$stmt = $conn->prepare(
    "UPDATE contacts
    SET FirstName = ?, LastName = ?, Email = ?, Phone = ?
    WHERE id = ?
    AND UserID = ?
);

// Bind parameters
$stmt->bind_param("ssssii", $FirstName, $LastName, $Email, $Phone, $id, $UserID);

// Execute query
$stmt->execute();

if($stmt->affected_rows === 0){
    returnWithError("No matching contact found to update");
}

$stmt->close();
$conn->close();

returnWithSuccess([
    "id"        => (int)$id,
    "FirstName  => $FirstName,
    "LastName"  => $LastName,
    "Email"     => $Email,
    "Phone"     => $Phone
]); 



// helper function

function returnWithError($err, $statusCode = 400)
{
    http_response_code($statusCode);
    echo json_encode(["error => $err"]);
    exit;
}

function returnWithSuccess($data)
{
    $data[error] = "";
    echo json_encode($data);
    exit;
}
?>