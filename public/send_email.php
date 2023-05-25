<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once "/vendor/autoload.php";

$mail = new PHPMailer;

try {
    $mail->isSMTP();
    $mail->Host = 'mail.2060.io';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    $name = htmlspecialchars($_POST['name']);
    $phone = htmlspecialchars($_POST['phone']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    $mail->From = $email;
    $mail->FromName = $name;

    $mail->addAddress("otmanine.salim@gmail.com");

    $mail->isHTML(true);

    $mail->Subject = "Website contact form";
    $mail->Body = "
        <p>Name : " . $name . "</p>
        <p>Phone: " . $phone . "</p>
        <p>Email: " . $email . "<br/></p>
        <p>Message: " . $message . "</p>"
    ;
    $mail->AltBody = $message;

    $mail->send();
    echo '<script language="javascript" type="text/javascript">';
    echo 'window.location.replace("succes");';
    echo '</script>';
} catch (Exception $e) {
    echo '<script language="javascript" type="text/javascript">';
    echo 'window.location.replace("error");';
    echo '</script>';
}
?>