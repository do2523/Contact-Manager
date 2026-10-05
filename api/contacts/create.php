<?php
    header("Content-Type: application/json");
// Check their logged in
    session_start();

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    returnWithError("Method not allowed", 405);
}
    if (!isset($_SESSION["user_id"])) {
        returnWithError("Not logged in", 401);
    }

    $UserID = $_SESSION["user_id"];

    $conn = require_once "../config/database.php";

    if($conn->connect_error){
        returnWithError($conn->connect_error, 500);
    }

    // Read JSON body
    $inData = json_decode(file_get_contents("php://input"), true);

    // Get fields from request
    $FirstName = $inData["FirstName"] ?? null;
    $LastName = $inData["LastName"] ?? null;
    $Phone = $inData["Phone"] ?? null;
    $Email = $inData["Email"] ?? null;

    // Validate required fields
    if (empty($FirstName) || empty($LastName)) {
    returnWithError("FirstName and LastName are required", 400);
}
    // Check for duplicates and that they added either phone or email
    if (!empty($Email) && !empty($Phone)) {
    $stmt = $conn->prepare(
        "SELECT ContactID, Email, Phone
         FROM contacts
         WHERE UserID = ?
         AND (Email = ? OR Phone = ?)
         LIMIT 1"
    );

    $stmt->bind_param("iss", $UserID, $Email, $Phone);

} 
elseif (empty($Email) && empty($Phone)) {
    returnWithError("Email or Phone is required", 400);
}

elseif (!empty($Email)) {
    $stmt = $conn->prepare(
        "SELECT ContactID, Email, Phone
         FROM contacts
         WHERE UserID = ?
         AND Email = ?
         LIMIT 1"
    );

    $stmt->bind_param("is", $UserID, $Email);

} else {
    $stmt = $conn->prepare(
        "SELECT ContactID, Email, Phone
         FROM contacts
         WHERE UserID = ?
         AND Phone = ?
         LIMIT 1"
    );

    $stmt->bind_param("is", $UserID, $Phone);
}

$stmt->execute();
$result = $stmt->get_result();
$duplicate = $result->fetch_assoc();
$stmt->close();

if ($duplicate) {
    if (!empty($Email) && $duplicate["Email"] === $Email) {
        returnWithError("A contact with this email already exists", 409);
    }

    if (!empty($Phone) && $duplicate["Phone"] === $Phone) {
        returnWithError("A contact with this phone number already exists", 409);
    }

    returnWithError("Contact already exists", 409);
}

    // Prepare INSERT query
    $stmt = $conn->prepare(
        // INSERT contact into contacts table
        "INSERT INTO contacts (UserID, FirstName, LastName, Email, Phone, DateCreated)
        VALUES(?, ?,?, ?, ?, NOW())"
    );

    if(!$stmt){
        returnWithError("Prepare failed: " . $conn->error, 500);
    }

    // Bind parameters "issss = one int UserID and then four strings
    $stmt->bind_param("issss", $UserID, $FirstName, $LastName, $Email, $Phone);



    // Execute statements
    if(!$stmt->execute()){
        returnWithError("Insert failed: " . $stmt->error, 500);
    }

    $ContactID = $conn->insert_id;


    // Close statement/connection
    $stmt->close();
    $conn->close();

    // Return success/error JSON
    returnWithSuccess([
        "ContactID" => $ContactID,
        "UserID" => (int)$UserID,
        "FirstName" => $FirstName,
        "LastName" => $LastName,
        "Phone"     => $Phone,
        "Email"     => $Email
    ]);

    // helper function

    function returnWithError($err, $statusCode = 400)
    {
        http_response_code($statusCode);
        echo json_encode(["contacts" => [], "error" => $err]);
        exit;
    }

    function returnWithSuccess($contactsArray)
    {
        echo json_encode(["contacts" => [$contactsArray], "error" => ""]);
        exit;
    }
    
?>