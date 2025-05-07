use db;
-- drop table ColourCombo;

create table ColourCombo(
		id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		workerID VARCHAR(255) NULL,
		assignmentID VARCHAR(255) NULL,
		experimentData JSON,
		reward VARCHAR(255) DEFAULT 0.00,
		task_start DATETIME DEFAULT NULL,
		task_end DATETIME DEFAULT NULL,
		assigned INT(2) DEFAULT 0,
		completed INT(2) DEFAULT 0
);

INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
INSERT INTO ColourCombo VALUES ();
select * from ColourCombo;