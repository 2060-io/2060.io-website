<?php
if (isset($_POST['email'])) {
    $name = htmlspecialchars($_POST['name']);
    $phone = htmlspecialchars($_POST['phone']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    $mailFrom = "From: " . $name . "<" . $email . ">";

    $mailTo = "fabrice@rochette.org";

    $mailSubject = "Website contact form";
    $mailBody = "
        Name : " . $name . " \n
        Phone: " . $phone . " \n
        Email: " . $email . " \n
        Message: " . $message;

    if (mail($mailTo, $mailSubject, $mailBody, $mailFrom)) {
        echo 'success';
    } else {
        echo 'error';
    }
}
?>