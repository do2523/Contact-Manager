<?php
 
	// Read and decode the JSON body of the request
	$inData = getRequestInfo();
 
	$searchResults = "";
	$searchCount = 0;
 
	// Connect to the database
	$conn = new mysqli("localhost", "TheBeast", "WELOVECOP4331", "COP4331");
	if ($conn->connect_error) 
	{
		// Database itself is unreachable — this is a server problem, not the caller's fault
		returnWithError( $conn->connect_error, 500 );
	} 
	else
	{
		$UserID = $inData["UserID"] ?? null;
 
		// Validate UserID, return 400 if it's missing
		if ( empty($UserID) )
		{
			returnWithError( "UserID is required", 400 );
		}
 
		// Format search term for LIKE (% wildcards match "contains" instead of "exact match")
		$searchTerm = "%" . $inData["search"] . "%";
 
		// Prepare search query — ? placeholders keep this safe from SQL injection
		$stmt = $conn->prepare("select ContactID, UserID, Username, Email, Phone, DateCreated from Contacts where Username like ? and UserID=?");
 
		// Bind parameters — fills in the ? placeholders in order
		$stmt->bind_param("ss", $searchTerm, $UserID);
 
		// Execute query
		$stmt->execute();
		
		// Get result set back from the query
		$result = $stmt->get_result();
		
		// Add matching contacts to array (built here as a JSON string, one object per row)
		while($row = $result->fetch_assoc())
		{
			if( $searchCount > 0 )
			{
				$searchResults .= ",";
			}
			$searchCount++;
			$searchResults .= '{"ContactID":' . $row["ContactID"] . ',"UserID":' . $row["UserID"] . ',"username":"' . $row["Username"] . '","Email":"' . $row["Email"] . '","Phone":"' . $row["Phone"] . '","DateCreated":"' . $row["DateCreated"] . '"}';
		}
		
		// Return contacts as JSON
		if( $searchCount == 0 )
		{
			returnWithError( "No Records Found", 400 );
		}
		else
		{
			returnWithInfo( $searchResults );
		}
		
		$stmt->close();
		$conn->close();
	}
 
	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}
 
	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}
	
	function returnWithError( $err, $statusCode = 400 )
	{
		http_response_code( $statusCode );
		$retValue = '{"contacts":[],"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
	
	function returnWithInfo( $searchResults )
	{
		$retValue = '{"contacts":[' . $searchResults . '],"error":""}';
		sendResultInfoAsJson( $retValue );
	}
	
?>