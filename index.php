<?php 
  session_start();
  require_once("lib/loader.inc");
  
  Utils::fetchModules("app");
  

  Logger::Log("hello");
  
  global $page;
  $page = new PageBuilder();

  Router::dispach();
  
  Logger::Log($_SERVER);
  

?>
