<?php

    header("Content-Type: application/json");

    require_once "../db.php";

    $mysqli = require_once "../config/database.php";

    $ContactID = $data["ContactID"] ?? null;
    $UserID = $data["UserID"] ?? null;
    $FirstName = $data["FirstName"] ?? null;
    $LastName = $data["LastName"] ?? null;
    $Phone = $data["Phone"] ?? null;
    $Email = $data["Email"] ?? null;

    // Validate request
    if (empty($ContactID) || empty($UserID) || empty($FirstName) || empty($LastName)) {
        returnWithError("Missing required fields");
    }
    // makes sure one user can never edit another user's contact  just by guessing an id
    // Prepare UPDATE query
    $stmt = $conn->prepare(
        "UPDATE Contacts
        SET FirstName = ?, LastName = ?, Email = ?, Phone = ?
        WHERE ContactID = ?
        AND UserID = ?"
    );

    // Bind parameters
    $stmt->bind_param("ssssii", $FirstName, $LastName, $Email, $Phone, $ContactID, $UserID);

    // Execute query
    if($stmt->execute()){
        returnWithError($stmt->error, 500);
    }

    if($stmt->affected_rows === 0){
        returnWithError("No matching contact found to update");
    }

    $stmt->close();
    $conn->close();

    returnWithSuccess([
        "ContactID"  => $ContactID,
        "FirstName"  => $FirstName,
        "LastName"  => $LastName,
        "Email"     => $Email,
        "Phone"     => $Phone
    ]); 



    // helper function

    function returnWithError($err, $statusCode = 400)
    {
        http_response_code($statusCode);
        echo json_encode(["error" => $err]);
        exit;
    }

    function returnWithSuccess($data)
    {
        $data["error"] = "";
        echo json_encode($data);
        exit;
    }
?>