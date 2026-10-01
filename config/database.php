<?php
$host = 'localhost'; $port = '3307'; $dbname = 'pharmcy';
$user = 'root'; $password = '';
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) { die("Database connection failed: " . $e->getMessage()); }
?>