<?php


header("Content-Type: application/json");
session_start();


if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    returnWithError("Method not allowed", 405);
}

if (!isset($_SESSION["user_id"])) {
        returnWithError("Not logged in", 401);
    }

$UserID = $_SESSION["user_id"];

// Connect to database
$conn = require_once "../config/database.php";


if ($conn->connect_error)
{
    returnWithError($conn->connect_error, 500);
}

// Get URL parameters
$search = $_GET["search"] ?? "";

// Search anywhere in first or last name
$parts = preg_split('/\s+/', trim($search));

$first = $parts[0] ?? "";
$second = $parts[1] ?? "";

$firstTerm = "%" . $first . "%";
$secondTerm = "%" . $second . "%";

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
     AND FirstName LIKE ?
     AND LastName LIKE ?"
);

if (!$stmt)
{
    returnWithError("Prepare failed: " . $conn->error, 500);
    exit;
}

$stmt->bind_param(
    "iss",
    $UserID,
    $firstTerm,
    $secondTerm
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
function returnWithSuccess($contacts)
{
    echo json_encode([
        "contacts" => $contacts,
        "error" => ""
    ]);

    exit;
}

returnWithSuccess($contacts);

function returnWithError($err, $statusCode = 400)
{
    http_response_code($statusCode);

    echo json_encode([
        "contacts" => [],
        "error" => $err
    ]);

    exit;
}


?>