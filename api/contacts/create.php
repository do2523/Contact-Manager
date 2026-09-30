<?php

    header("Content-Type: application/json");

    $conn = require_once "../config/database.php";

    if($conn->connect_error){
        returnWithError($conn->connect_error, 500);
    }

    // Read JSON body
    $inData = json_decode(file_get_contents("php://input"), true);

    // Get fields from request
    $UserID = $inData["UserID"] ?? null;
    $FirstName = $inData["FirstName"] ?? null;
    $LastName = $inData["LastName"] ?? null;
    $Phone = $inData["Phone"] ?? null;
    $Email = $inData["Email"] ?? null;

    // Validate required fields
    if (empty($UserID) || empty($FirstName) || empty($LastName)) {
        returnWithError("UserID, FirstName, and LastName are required", 400);
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
    $stmt->bind_param("issss", $UserID, $FirstName, $LastName, $Phone, $Email);



    // Execute statement
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
// end of file