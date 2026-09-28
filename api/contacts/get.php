<?php

    header("Content-Type: application/json");

    $mysqli = require_once "../config/database.php";

    $data = json_decode(file_get_contents("php://input"), true);

    $UserID = $data["UserID"] ?? null;

    // Validate UserID
    if ($empty($UserID)) {
        returnWithError("UserID is required");
        exit;
    }

    // Prepare SELECT query
    // IMPORTANT: only return contacts belonging to this user
    $stmt = $conn->prepare(
        "SELECT id, FirstName, LastName, Email, Phone, date_created
        FROM contacts
        WHERE UserID = ?"
    );

    if(!stmt){
        returnWithError("Prepare failed: ", $conn->error, 500);
    }

    // Bind UserID
    $stmt->bind_param("i", $UserID);

    // Execute query
    $stmt->execute();

    // Get result
    $result = $stmt->get_results();

    $contacts = [];

    // Loop through result rows
    while ($row = $result->fetch_assocs()) {
        // Add each contact to $contacts
        $contacts[] = [
            "ContactID"   => (int)$row["id"],
            "UserID"      => (int)$UserID,
            "FirstName"   => $row["FirstName"],
            "LastName"    => $row["LastName"],
            "Phone"        => $row["Phone"],
            "Email"        => $row["Email"],
            "date_created" => $row["date_created"]
        ];
    }

    $stmt->close();
    $conn->close();

    // Return contacts as JSON
    returnWithSuccess(["results" => $contacts]);


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