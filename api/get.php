    <?php
 
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

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


    // Prepare SELECT query
    $stmt = $conn->prepare(
        "SELECT ContactID, UserID, FirstName, LastName, Email, Phone, DateCreated
        FROM contacts
        WHERE UserID = ?"
    );

    if (!$stmt)
    {
        returnWithError("Prepare failed: " . $conn->error, 500);
    }

    // Bind UserID
    $stmt->bind_param("i", $UserID);

    // Execute query
    if (!$stmt->execute())
    {
        returnWithError("Execute failed: " . $stmt->error, 500);
    }

    // Get result
    $result = $stmt->get_result();

    $contacts = array();

    // Loop through results
    while ($row = $result->fetch_assoc())
    {
        $contacts[] = array(
            "ContactID" => (int)$row["ContactID"],
            "UserID" => (int)$row["UserID"],
            "FirstName" => $row["FirstName"],
            "LastName" => $row["LastName"],
            "Phone" => $row["Phone"],
            "Email" => $row["Email"],
            "DateCreated" => $row["DateCreated"]
        );
    }

    // Close connection
    $stmt->close();
    $conn->close();

    // Return results
    returnWithSuccess($contacts);

    function returnWithError($err, $statusCode = 400)
    {
        http_response_code($statusCode);

        echo json_encode(array(
            "contacts" => array(),
            "error" => $err
        ));

        exit;
    }

    function returnWithSuccess($contacts)
    {
        echo json_encode(array(
            "contacts" => $contacts,
            "error" => ""
        ));

        exit;
    }
    ?>