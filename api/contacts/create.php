<?php

header("Content-Type: application/json");

//require_once "../db.php";
$conn = new mysqli("localhost", "TheBeast", "WELOVECOP4331", "COP4331");
if($conn->connect_error){
    returnWithError($conn->connect_error);
}

// Read JSON body
$data = json_decode(file_get_contents("php://input"), true);

// Get fields from request
$UserID = $data["UserID"] ?? null;
$firstName = $data["FirstName"] ?? null;
$LastName = $data["LastName"] ?? null;
$Phone = $data["Phone"] ?? null;
$Email = $data["Email"] ?? null;

// Validate required fields
if (empty($UserID) || empty($firstName) || empty($LastName)) {
    returnWithError("UserID, FirstName, and LastName are required");
}

// Prepare INSERT query
$stmt = $conn->prepare(
    // INSERT contact into contacts table
    "INSERT INTO contacts (UserID, FirstName, LastName, Email, Phone, date_created)
    VALUES(?, ?,?, ?, ?, NOW())"
);

if(!$stmt)(
    returnWithError("Prepare failed: " . $conn->error, 500);
)

// Bind parameters "issss = one int UserID and then four strings
$stmt->bind_param("issss", $UserID, $firstName, $LastName, $Email, $Phone);



// Execute statement
if(!stmt->execute()){
    returnWithError("Insert failed: " . $stmt->error, 500)
}

$ContactID = $stmt->insert_id;


// Close statement/connection
$stmt->close();
$conn->close();

// Return success/error JSON
returnWithSuccess([
    "ContactID" => $ContactID,
    "UserID" => (int)$UserID,
    "FirstName" => $firstName,
    "LastName" => $LastName,
    "Phone"     => $Phone
    "Email"     => $Email
]);

// helper function

function returnWithError($err, $statusCode = 400)
{
    http_response_code($statusCode);
    echo json_encode(["error => $err"]);
    exit;
}

function returnWithSuccess($contactsArray)
{
    echo json_encode($data);
    exit;
}

?>