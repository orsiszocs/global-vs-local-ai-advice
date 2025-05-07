<?php
function debug_to_console($data) {
    $output = $data;
    if (is_array($output))
        $output = implode(',', $output);

    echo "<script>console.log('Debug Objects: " . $output . "' );</script>";
}

function curPageURL() {
 $pageURL = 'http';
 if ( isset( $_SERVER["HTTPS"] ) && strtolower( $_SERVER["HTTPS"] ) == "on" ) {
    $pageURL .= "s";
	}
 $pageURL .= "://";
 if ($_SERVER["SERVER_PORT"] != "80") {
  $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
 } else {
  $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
 }
 return $pageURL;
}

$curURL = curPageURL();
$parse = parse_url($curURL);
$domain = $parse['host'];

// TODO
if ($domain == 'localhost'){
	$host = 'localhost';
	$user = 'root';
	$pass = 'root';
	$dbname = 'db';
}



if( isset($_GET['action']) ){
    $action = $_GET['action'];
}

if(isset($_POST['action'])){
    echo 'post get';
    $complet_action = $_POST['action'];
    $workerID = $_POST['workerID'];
    $assignmentID = $_POST['assignmentID'];
    $experimentData= $_POST['experimentData'];
    $reward = $_POST['reward'];
    $id = $_POST['scenarioId'];
    completeScenario($host, $user, $pass, $dbname , $workerID, $assignmentID, $experimentData, $reward, $id);
}

if ($action == 'assignScenario'){
	assignScenario($host, $user, $pass, $dbname);
}

function assignScenario($host, $user, $pass, $dbname){
	$conn = new mysqli($host, $user, $pass, $dbname);
	if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
	} ;
	$query = "SELECT * FROM ColourCombo WHERE assigned<1 AND completed<1 ORDER BY RAND() LIMIT 1";
	$result = mysqli_query($conn, $query);
	if ($result->num_rows !== 0) {
		// if there are scenarios available, assign one to the participant
		$scenarioRow = $result->fetch_array(MYSQLI_ASSOC);
		$id = $scenarioRow['id'];
		$update_query = "UPDATE ColourCombo SET task_start=now(), assigned=assigned + 1 WHERE id=?;";
		$update = $conn -> prepare($update_query);
		$update -> bind_param("i", $id);
		if ($result = $update->execute()){
		  	$update->free_result();
		}
		echo json_encode(array('scenarioId' => $id));
		$conn->close();
	}
	else {
		// if all scenarios are assigned, create a new one
		$result->close();
		$insert_query = "INSERT INTO ColourCombo (task_start, assigned) VALUES (NOW(), '1')";
		$stmt = $conn->prepare($insert_query);
		$stmt->execute();
		$id = mysqli_insert_id($conn);
		echo json_encode(array('scenarioId' => $id));
		$stmt->close();
		$conn->close();
		
	}
}


function completeScenario($host, $user, $pass, $dbname, $workerID, $assignmentID, $experimentData, $reward, $id){
	$conn = new mysqli($host, $user, $pass, $dbname);
	if ($conn->connect_error) {
    	http_response_code(500);
        echo "Connection failed: " . $conn->connect_error;
        exit();
    }

	$workerID = mysqli_real_escape_string($conn, $workerID);
	$assignmentID = mysqli_real_escape_string($conn, $assignmentID);
	$query = $conn->prepare("UPDATE ColourCombo set task_end=now(), workerID=?, assignmentID=?, experimentData=?, reward = ?, completed=completed + 1 WHERE id=?");
	$query -> bind_param("ssssi", $workerID, $assignmentID,  $experimentData, $reward, $id);
	if ($result = $query->execute()) {
    $query->free_result();
	}
	else {
		echo "error";
	}
	$conn->close();
}
?>