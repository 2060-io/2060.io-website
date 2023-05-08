import os 
import smtplib

def send_email(name,email,phone,message):
    to = 'test@hotmail.fr'
    subject = f"Message from '{name}'"
    body = f"Name: {name}\nEmail: {email}\nPhone: {phone}\nMessage: {message}"
    headers = f"From: {email}\r\n" f"Reply-To: {email}\r\n" f"Subject: {subject}\r\n"
    email_message = headers + "\r\n" + body

    smtp_server = "smtp.gmail.com"  # Update with your SMTP server
    smtp_port = 587  # Update with the SMTP server port
    smtp_username = "youdev99@gmail.com"  # Update with your SMTP username
    smtp_password = "050299yb"  # Update with your SMTP password
