<?php
require 'phpZabbix/ZabbixApiAbstract.class.php';
require 'phpZabbix/ZabbixApi.class.php';

if (isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
  header('Content-type: application/json');
  $data = file_get_contents("php://input");
  $objData = json_decode($data);
  $method = $objData->method;

  $args = Array();
  if (!empty($objData->params)) {
    foreach ($objData->params as $key => $value) {
      $args[$key] = $value;
    }
  }

  try {
    $api = new ZabbixApi('http://zabbixcm02.internal.corp/zabbix/api_jsonrpc.php', 
          'frontend', 'frontend');
    $result = $api->$method($args);

    echo json_encode($result);
  }
  catch(Exception $e) {
    echo $e->getMessage();
  }
}
exit;
?>