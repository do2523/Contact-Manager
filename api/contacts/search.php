<?php


header("Content-Type: application/json");


// Connect to database
$conn = require_once "../config/database.php";


if ($conn->connect_error)
{
    returnWithError($conn->connect_error, 500);
}

// Get URL parameters
$UserID = $_GET["UserID"] ?? null;
$search = $_GET["search"] ?? "";

// Validate UserID
if (empty($UserID))
{
    returnWithError("UserID is required", 400);
}

// Search anywhere in first or last name
$searchTerm = "%" . $search . "%";

$stmt = $conn->prepare(
    "SELECT ContactID,
            UserID,
            FirstName,
            LastName,
            Email,
            Phone,
            DateCreated
     FROM contacts
     WHERE UserID = ?
     AND (
         FirstName LIKE ?
         OR LastName LIKE ?
     )"
);

if (!$stmt)
{
    returnWithError("Prepare failed: " . $conn->error, 500);
}

$stmt->bind_param(
    "iss",
    $UserID,
    $searchTerm,
    $searchTerm
);


if (!$stmt->execute())
{
    returnWithError("Execute failed: " . $stmt->error, 500);
}

$result = $stmt->get_result();

$contacts = [];
while ($row = $result->fetch_assoc())
{
    $contacts[] = $row;
}

$stmt->close();
$conn->close();

if (count($contacts) === 0)
{
    returnWithError("No Records Found", 404);
}

echo json_encode([
    "contacts" => $contacts,
    "error" => ""
]);

function returnWithError($err, $statusCode = 400)
{
    http_response_code($statusCode);

    echo json_encode([
        "contacts" => [],
        "error" => $err
    ]);

    exit;
}

// Helper function for success response
function returnWithSuccess($contacts)
{
    echo json_encode([
        "contacts" => $contacts,
        "error" => ""
    ]);

    exit;
}

?>

// end of file