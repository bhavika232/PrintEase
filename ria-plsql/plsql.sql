DELIMITER $$
-- PROCEDURE 1: Submit Print Request
CREATE PROCEDURE SubmitPrintRequest(
    IN p_user_id   INT,
    IN p_file_name VARCHAR(255),
    IN p_copies    INT,
    IN p_color     ENUM('BW','COLOR'),
    IN p_pages     VARCHAR(50)
)
BEGIN
    DECLARE v_doc_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error occurred during submission' AS message;
    END;

    IF p_copies <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Copies must be greater than zero.';
    END IF;

    START TRANSACTION;

    INSERT INTO Documents (user_id, file_name)
    VALUES (p_user_id, p_file_name);

    SET v_doc_id = LAST_INSERT_ID();

    INSERT INTO PrintRequests (doc_id, copies, color, pages, status)
    VALUES (v_doc_id, p_copies, p_color, p_pages, 'Pending');

    COMMIT;

    SELECT 'Request submitted successfully' AS message,
            v_doc_id AS doc_id;
END$$

-- PROCEDURE 2: Get User Request History
CREATE PROCEDURE GetUserRequestHistory(
    IN p_user_id INT
)
BEGIN
    SELECT 
        pr.req_id,
        d.file_name,
        pr.copies,
        pr.color,
        pr.pages,
        pr.status,
        pr.request_date,
        CASE 
            WHEN pr.color = 'COLOR' THEN
                pr.copies * 
                CASE WHEN pr.pages = 'ALL' THEN 10 
                     ELSE CAST(pr.pages AS UNSIGNED) END * 5.00
            ELSE
                pr.copies * 
                CASE WHEN pr.pages = 'ALL' THEN 10 
                     ELSE CAST(pr.pages AS UNSIGNED) END * 1.50
        END AS estimated_cost
    FROM PrintRequests pr
    JOIN Documents d ON pr.doc_id = d.doc_id
    WHERE d.user_id = p_user_id
    ORDER BY pr.request_date DESC;
END$$

-- PROCEDURE 3: Update Request Status (Admin)
CREATE PROCEDURE UpdateRequestStatus(
    IN p_req_id INT,
    IN p_status ENUM('Pending','Processing','Completed')
)
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count
    FROM PrintRequests
    WHERE req_id = p_req_id;

    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No request found with given ID.';
    END IF;

    UPDATE PrintRequests
    SET status = p_status
    WHERE req_id = p_req_id;

    SELECT 'Status updated successfully' AS message;
END$$

-- PROCEDURE 4: Admin Dashboard Summary
CREATE PROCEDURE GetAdminDashboard()
BEGIN
    SELECT status,
           COUNT(*) AS total_requests
    FROM PrintRequests
    GROUP BY status;

    SELECT 
        u.name,
        COUNT(pr.req_id) AS total_requests,
        SUM(
            CASE 
                WHEN pr.color = 'COLOR' THEN
                    pr.copies * 
                    CASE WHEN pr.pages = 'ALL' THEN 10 
                         ELSE CAST(pr.pages AS UNSIGNED) END * 5.00
                ELSE
                    pr.copies * 
                    CASE WHEN pr.pages = 'ALL' THEN 10 
                         ELSE CAST(pr.pages AS UNSIGNED) END * 1.50
            END
        ) AS total_estimated_cost
    FROM Users u
    JOIN Documents d ON u.user_id = d.user_id
    JOIN PrintRequests pr ON d.doc_id = pr.doc_id
    GROUP BY u.user_id, u.name
    ORDER BY total_estimated_cost DESC;
END$$

-- FUNCTION: Calculate Print Cost
CREATE FUNCTION CalculatePrintCost(
    p_copies INT,
    p_color  VARCHAR(10),
    p_pages  VARCHAR(50)
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_page_count INT;
    DECLARE v_cost DECIMAL(10,2);

    IF p_pages = 'ALL' THEN
        SET v_page_count = 10;
    ELSE
        SET v_page_count = CAST(p_pages AS UNSIGNED);
    END IF;

    IF p_color = 'COLOR' THEN
        SET v_cost = p_copies * v_page_count * 5.00;
    ELSE
        SET v_cost = p_copies * v_page_count * 1.50;
    END IF;

    RETURN v_cost;
END$$

-- TRIGGER 1: Auto-escalate bulk requests
CREATE TRIGGER trg_bulk_processing
AFTER INSERT ON PrintRequests
FOR EACH ROW
BEGIN
    IF NEW.copies > 5 THEN
        UPDATE PrintRequests
        SET status = 'Processing'
        WHERE req_id = NEW.req_id;
    END IF;
END$$

DELIMITER ;