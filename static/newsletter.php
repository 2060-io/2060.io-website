<?php
if (isset($_POST['email'])) {
    $email = htmlspecialchars($_POST['email']);

    $mailFrom = "From: " . $email . "<" . $email . ">";

    $mailTo = "fabrice@rochette.org";

    $mailSubject = "Website contact form";
    $mailBody = "Email: " . $email;

    if (mail($mailTo, $mailSubject, $mailBody, $mailFrom)) {
        echo 'success';
    } else {
        echo 'error';
    }
}
?>