USE contact_manager;

DELIMITER //

--Inserts 10 records of test contact data into contact
CREATE PROCEDURE fill_contacts()
BEGIN
    DECLARE i INT DEFAULT 0;

    WHILE i < 10 DO
        INSERT INTO CONTACTS(FirstName, LastName, Email, Phone, DateCreated)
        VALUES (CONCAT('John_' , i),
                CONCAT('Doe_' , i),
                CONCAT('TestEmail_' , i),
                REPEAT(i,10),
                NOW()
        );    

        SET i = i + 1;
    END WHILE;
END//

--Inserts 5 records of test user data into users
CREATE PROCEDURE fill_users()
BEGIN
    DECLARE i INT DEFAULT 0;

    WHILE i < 5 DO
        INSERT INTO USERS(Username,Password)
        VALUES (CONCAT('TestUser_' , i),
                CONCAT('TestPass_', i)
        );

        SET i = i + 1;
    END WHILE;
END//

DELIMITER ;