USE contact_manager;

DELIMITER //

--Inserts 10 records of test contact data into contact
CREATE PROCEDURE fill_contacts()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE J INT DEFAULT 1;

    WHILE i <= 10 DO
        INSERT INTO contacts(UserID, FirstName, LastName, Email, Phone, DateCreated)
        VALUES (j,
                CONCAT('John_' , i),
                CONCAT('Doe_' , i),
                CONCAT('TestEmail_' , i),
                REPEAT(CONCAT(i),10),
                NOW()
        );

        IF (i % 2) = 0 THEN
            SET j = j + 1;
        END IF;

        SET i = i + 1;
    END WHILE;
END//

--Inserts 5 records of test user data into users
CREATE PROCEDURE fill_users()
BEGIN
    DECLARE i INT DEFAULT 1;

    WHILE i <= 5 DO
        INSERT INTO users(Username, Password)
        VALUES (CONCAT('TestUser_' , i),
                CONCAT('TestPass_', i)
        );

        SET i = i + 1;
    END WHILE;
END//

DELIMITER ;

CALL fill_users();
CALL fill_contacts();