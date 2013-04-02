<?php

$callback = $_GET['callback'];
if (!preg_match('/^[a-zA-Z0-9_]+$/', $callback)) {
  die('Invalid callback name');
}

$start = $_GET['start'];
if ($start && !preg_match('/^[0-9]+$/', $start)) {
  die("Invalid start parameter: $start");
}

$id = $_GET['id'];
if ($id && !preg_match('/^[0-9]+$/', $id)) {
  die("Invalid start parameter: $id");
}

$end = $_GET['end'];
if ($end && !preg_match('/^[0-9]+$/', $end)) {
  die("Invalid end parameter: $end");
}
if (!$end) $end = mktime() * 1000;


mysql_connect('localhost', 'zabbix', 'zabbix') or die(mysql_error());
mysql_select_db('zabbix') or die(mysql_error());
mysql_query("SET time_zone = '+00:00'");

$range = $end - $start;
$startTime = gmstrftime('%Y-%m-%d %H:%M:%S', $start / 1000);
$endTime = gmstrftime('%Y-%m-%d %H:%M:%S', $end / 1000);
$table = 'history';

// two days range
if ($range < 2 * 24 * 3600 * 1000) {
  //load fully, with every detail
  $sql = "
    select *
    from $table 
    where 
      clock between '$startTime' and '$endTime'
      itemid=='$id'
    order by clock
  ";

// one week range
} elseif ($range < 7 * 24 * 3600 * 1000) {

  //load every hour
  $sql = "
    select *
    from $table 
    where 
      clock between '$startTime' and '$endTime'
      itemid=='$id'
    order by clock
  ";

// one month range
} elseif ($range < 30 * 24 * 3600 * 1000) {

  //load every 12 hours
  $sql = "
    select *
    from $table 
    where 
      clock between '$startTime' and '$endTime'
      itemid=='$id'
    order by clock
  ";

// greater range
} else {

  //load daily data
  $sql = "
    select *
    from $table 
    where 
      clock between '$startTime' and '$endTime'
      itemid=='$id'
    order by clock
  ";

}

?>