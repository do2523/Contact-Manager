USE contact_manager;

DELIMITER //

-- Adds a new user to the user table
CREATE PROCEDURE add_user(
    IN U_name VARCHAR(50),
    IN U_pass VARCHAR(225)
)
BEGIN
    INSERT INTO users(Username, Password)
    VALUES(U_name, U_pass);
END //

-- Deletes a user from the user table
CREATE PROCEDURE remove_user(
    IN U_name VARCHAR(50),
    IN U_pass VARCHAR(225)
)
BEGIN
    DELETE FROM users WHERE Username = U_name AND Password = U_pass;
END //

-- Adds a contact to the contacts table
CREATE PROCEDURE add_contact(
    IN U_ID INT,
    IN F_Name VARCHAR(50),
    IN L_Name VARCHAR(50),
    IN E_mail VARCHAR(100),
    IN Phone_num VARCHAR(20)
)
BEGIN
    INSERT INTO contacts(UserID, FirstName, LastName, Email, Phone, DateCreated)
    VALUES(U_ID, F_Name, L_Name, E_mail, Phone_num, NOW());
END //

-- Deletes a contact from the contact table
CREATE PROCEDURE delete_contact(
    IN Con_ID INT
)
BEGIN
    DELETE FROM contacts WHERE ContactID = Con_ID;
END //


-- Searches a contact by user ID and first name or last name
CREATE PROCEDURE search_contact(
    IN U_ID INT,
    IN F_Name VARCHAR(50)
)
BEGIN
    SELECT * FROM contacts WHERE UserID = U_ID AND 
    (FirstName LIKE CONCAT('%', F_Name, '%') OR LastName LIKE CONCAT('%', F_Name, '%'));  
END //

DELIMITER ;