<?php

header("Content-Type: application/json");

// Connect to database
$conn = require_once "../config/database.php";

if ($conn->connect_error)
{
    returnWithError($conn->connect_error, 500);
}

// Read JSON body
$data = json_decode(file_get_contents("php://input"), true);

// Check for valid JSON
if ($data === null)
{
    returnWithError("Invalid JSON request", 400);
}

// Get fields from request
$ContactID = $data["ContactID"] ?? null;
$UserID = $data["UserID"] ?? null;
$FirstName = $data["FirstName"] ?? null;
$LastName = $data["LastName"] ?? null;
$Phone = $data["Phone"] ?? null;
$Email = $data["Email"] ?? null;

// Validate required fields
if (empty($ContactID) || empty($UserID) || empty($FirstName) || empty($LastName))
{
    returnWithError(
        "ContactID, UserID, FirstName, and LastName are required",
        400
    );
}

// Prepare UPDATE query
// Make sure the contact belongs to the specified user
$stmt = $conn->prepare(
    "UPDATE contacts
     SET FirstName = ?,
         LastName = ?,
         Email = ?,
         Phone = ?
     WHERE ContactID = ?
     AND UserID = ?"
);

if (!$stmt)
{
    returnWithError("Prepare failed: " . $conn->error, 500);
}

// Bind parameters
$stmt->bind_param(
    "ssssii",
    $FirstName,
    $LastName,
    $Email,
    $Phone,
    $ContactID,
    $UserID
);

// Execute query
if (!$stmt->execute())
{
    returnWithError("Update failed: " . $stmt->error, 500);
}

// Check if contact was found
if ($stmt->affected_rows === 0)
{
    returnWithError("No matching contact found to update", 404);
}

// Close statement and connection
$stmt->close();
$conn->close();

// Return successful response
returnWithSuccess([
    "ContactID" => (int)$ContactID,
    "UserID" => (int)$UserID,
    "FirstName" => $FirstName,
    "LastName" => $LastName,
    "Email" => $Email,
    "Phone" => $Phone
]);


// Helper function
function returnWithError($err, $statusCode = 400)
{
    http_response_code($statusCode);

    echo json_encode([
        "contacts" => [],
        "error" => $err
    ]);

    exit;
}

function returnWithSuccess($contact)
{
    echo json_encode([
        "contacts" => [$contact],
        "error" => ""
    ]);

    exit;
}

?>